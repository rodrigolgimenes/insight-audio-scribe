
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSaveRecording = (onRecordingSaved: (noteId: string) => void) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);

  const handleSave = async (audioUrl: string, recordingDuration: number) => {
    if (!audioUrl) return;
    
    try {
      setIsSaving(true);
      setSaveProgress(10);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to save recordings");
      }
      
      const response = await fetch(audioUrl);
      const recordingBlob = await response.blob();
      
      setSaveProgress(25);
      const fileName = `${user.id}/${Date.now()}.${recordingBlob.type.split('/')[1]}`;
      
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: Math.round(recordingDuration),
          file_path: fileName,
          user_id: user.id,
          status: 'pending',
          needs_compression: true,
          original_file_type: recordingBlob.type
        })
        .select()
        .single();
      
      if (dbError) throw new Error(`Failed to save recording: ${dbError.message}`);
      
      setSaveProgress(60);
      
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(recordingDuration)
        })
        .select()
        .single();
      
      if (noteError) throw new Error(`Failed to create note: ${noteError.message}`);
      
      setSaveProgress(75);
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, recordingBlob, {
          contentType: recordingBlob.type,
          upsert: true
        });
      
      if (uploadError) {
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      setSaveProgress(90);
      
      await supabase.functions.invoke('process-recording', {
        body: { 
          recordingId: recordingData.id, 
          noteId: noteData.id,
          priority: 'high'
        },
      });
      
      setSaveProgress(100);
      toast.success("Recording saved! Processing will continue in the background.");
      
      onRecordingSaved(noteData.id);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save recording");
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  return {
    handleSave,
    isSaving,
    saveProgress
  };
};
