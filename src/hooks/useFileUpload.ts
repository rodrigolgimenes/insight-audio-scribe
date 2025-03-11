
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

    // Check file size - limiting to 100MB
    const maxSizeInBytes = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSizeInBytes) {
      toast({
        title: "Error",
        description: `File is too large. Maximum allowed size is 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
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
          duration: durationInMs // Save duration in milliseconds
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Error creating record: ${dbError.message}`);
      }
      console.log('Recording entry created:', recordingData);

      // Configure chunked upload for large files
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      let uploadedBytes = 0;
      const totalBytes = file.size;
      
      if (totalBytes > 25 * 1024 * 1024) {
        console.log(`Starting chunked upload for large file (${(totalBytes / (1024 * 1024)).toFixed(2)}MB)`);
      }

      // Then upload the file
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          onUploadProgress: (progress) => {
            uploadedBytes = progress.uploadedBytes;
            const percentComplete = Math.round((uploadedBytes / totalBytes) * 100);
            console.log(`Upload progress: ${percentComplete}%`);
          }
        });

      if (uploadError) {
        // Clean up the recording entry if upload fails
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);
          
        if (uploadError.message.includes('exceeded the maximum allowed size')) {
          throw new Error(`Failed to upload file: The file exceeds the maximum allowed size (100MB).`);
        } else {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
      }

      // Update recording status to uploaded
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ status: 'uploaded' })
        .eq('id', recordingData.id);

      if (updateError) {
        throw new Error(`Error updating recording status: ${updateError.message}`);
      }

      // Create note with explicit duration
      const { error: noteError } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          processed_content: '',
          duration: durationInMs // Explicitly set the duration in the notes table too
        });

      if (noteError) {
        console.error('Error creating note:', noteError);
        throw new Error(`Failed to create note: ${noteError.message}`);
      }

      // Start processing in background
      supabase.functions
        .invoke('process-recording', {
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
