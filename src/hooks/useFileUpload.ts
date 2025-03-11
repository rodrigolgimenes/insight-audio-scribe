
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getMediaDuration } from "@/utils/mediaUtils";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Unsupported file format. Please use audio files (MP3, WAV, WebM) or video files (MP4).",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Getting media duration...');
      let durationInMs = 0;
      
      try {
        durationInMs = await getMediaDuration(file);
        console.log('Successfully got media duration:', durationInMs);
      } catch (durationError) {
        console.error('Error getting media duration:', durationError);
        // Default to 0 if we can't get duration
      }
      
      console.log('Media duration in milliseconds:', durationInMs);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^\x00-\x7F]/g, '')}`;

      // First create recording entry
      console.log('Creating initial recording entry with duration:', durationInMs);
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title: file.name || `Recording ${new Date().toLocaleString()}`,
          file_path: fileName,
          status: 'pending',
          duration: durationInMs
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Error creating record: ${dbError.message}`);
      }
      console.log('Recording entry created:', recordingData);

      // Then upload the file
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        // Clean up the recording entry if upload fails
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Update recording status to uploaded
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ status: 'uploaded' })
        .eq('id', recordingData.id);

      if (updateError) {
        throw new Error(`Error updating recording status: ${updateError.message}`);
      }

      // Create note
      const { error: noteError } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          processed_content: '',
          duration: durationInMs // Explicitly set the duration in the notes table
        });

      if (noteError) {
        console.error('Error creating note:', noteError);
        throw new Error(`Failed to create note: ${noteError.message}`);
      }

      // Start processing in background
      supabase.functions
        .invoke('transcribe-audio', {
          body: { 
            recordingId: recordingData.id
          }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error starting transcription:', error);
            toast({
              title: "Warning",
              description: "File uploaded but transcription failed to start. It will retry automatically.",
              variant: "destructive",
            });
          }
        });

      // Show success message and redirect immediately
      toast({
        title: "Success",
        description: "File uploaded successfully! You can track the transcription progress in the dashboard.",
      });

      // Redirect to dashboard
      navigate("/app");

    } catch (error) {
      console.error('Error uploading file:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Error processing file: ${error.message}` 
          : "Error processing file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return {
    isUploading,
    handleFileUpload
  };
};
