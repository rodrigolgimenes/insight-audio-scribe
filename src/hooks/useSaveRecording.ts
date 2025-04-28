
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSaveRecording = (onRecordingSaved: (noteId: string) => void) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);

  const validateAudioBlob = async (blob: Blob | null): Promise<boolean> => {
    if (!blob) return false;
    if (blob.size === 0) return false;
    
    // Check if it's a valid audio format
    const validTypes = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/wav', 'audio/mpeg'];
    const isValidType = validTypes.some(type => blob.type.includes(type));
    
    console.log(`[useSaveRecording] Validating blob: size=${blob.size}, type=${blob.type}, valid=${isValidType}`);
    return isValidType;
  };

  const handleSave = async (audioUrl: string, recordingDuration: number) => {
    if (!audioUrl) {
      toast.error("No recording to save");
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveProgress(10);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to save recordings");
      }
      
      // Get the blob from audio URL
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error("Failed to retrieve recording data");
      }
      
      const recordingBlob = await response.blob();
      
      // Validate blob before proceeding
      const isValid = await validateAudioBlob(recordingBlob);
      if (!isValid) {
        throw new Error("Invalid audio recording format or empty recording");
      }
      
      setSaveProgress(25);
      
      // Ensure recording duration is stored in milliseconds for consistency with backend
      // If it's already in milliseconds (over 1000), keep it as is; if in seconds, convert to ms
      const durationInMs = recordingDuration > 1000 
        ? Math.round(recordingDuration) 
        : Math.round(recordingDuration * 1000);
      
      console.log(`[useSaveRecording] Original duration: ${recordingDuration}, Normalized: ${durationInMs}ms`);
      
      const fileName = `${user.id}/${Date.now()}.${getExtensionFromMimeType(recordingBlob.type)}`;
      
      // Create recording entry in database
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: durationInMs,
          file_path: fileName,
          user_id: user.id,
          status: 'pending',
          needs_compression: true,
          original_file_type: recordingBlob.type
        })
        .select()
        .single();
      
      if (dbError) {
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }
      
      setSaveProgress(60);
      
      // Create note entry
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: durationInMs
        })
        .select()
        .single();
      
      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }
      
      setSaveProgress(75);
      
      // Upload the audio file
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, recordingBlob, {
          contentType: recordingBlob.type,
          upsert: true
        });
      
      if (uploadError) {
        // Delete the recording and note if upload fails
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      setSaveProgress(90);
      
      // Create a processing log
      try {
        await supabase
          .from('processing_logs')
          .insert({
            recording_id: recordingData.id,
            note_id: noteData.id,
            stage: 'upload_complete',
            message: 'Original file uploaded successfully, pending compression and processing',
            status: 'success',
            details: {
              originalFormat: recordingBlob.type,
              originalSize: recordingBlob.size,
              pendingCompression: true,
              durationMs: durationInMs
            }
          });
      } catch (error) {
        console.error("Error creating processing log:", error);
        // Non-critical error, continue execution
      }
      
      // Start background processing
      try {
        await supabase.functions.invoke('process-recording', {
          body: { 
            recordingId: recordingData.id, 
            noteId: noteData.id,
            priority: 'high'
          },
        });
        
        toast.success("Recording saved! Processing will continue in the background.");
      } catch (processError) {
        console.error("Error invoking processing function:", processError);
        toast.warning("Recording saved but processing failed to start. It will retry automatically.");
      }
      
      setSaveProgress(100);
      
      // Call the callback with the note ID
      onRecordingSaved(noteData.id);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save recording");
      return { success: false };
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  // Helper function to get file extension from MIME type
  const getExtensionFromMimeType = (mimeType: string): string => {
    const mimeToExt: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'audio/flac': 'flac'
    };
    
    return mimeToExt[mimeType] || 'mp3';
  };

  return {
    handleSave,
    isSaving,
    saveProgress
  };
};
