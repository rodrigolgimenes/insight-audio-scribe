
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToast as useUIToast } from '@/components/ui/use-toast';

export const useFileUploadHandler = (
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: ReturnType<typeof useUIToast>['toast']
) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFileUpload = async (
    file: File,
    initiateTranscription = true
  ): Promise<{ noteId: string; recordingId: string } | undefined> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload files.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress(10);
      console.log('Starting file upload process...');

      // For progress tracking
      let fetchController: AbortController | null = null;

      // Check if file is video (needs audio extraction)
      const isVideoFile = file.type.startsWith('video/');
      const isAudioFile = file.type.startsWith('audio/');
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Create a unique path for the file
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}_${fileName}`;
      
      console.log(`File path for upload: ${filePath}`);
      console.log(`File type: ${file.type}`);

      setUploadProgress(20);

      // Create recording entry first
      const { data: recordingData, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title: file.name.split('.')[0],
          file_path: filePath,
          status: 'pending',
          original_file_type: file.type,
          needs_audio_extraction: isVideoFile
        })
        .select()
        .single();

      if (recordingError) {
        console.error('Error creating recording record:', recordingError);
        throw new Error(`Failed to prepare upload: ${recordingError.message}`);
      }

      console.log('Created recording record:', recordingData.id);
      setUploadProgress(30);

      // Create note entry
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          recording_id: recordingData.id,
          title: file.name.split('.')[0],
          processed_content: '',
          status: 'pending',
          processing_progress: 0
        })
        .select()
        .single();

      if (noteError) {
        console.error('Error creating note record:', noteError);
        throw new Error(`Failed to create note: ${noteError.message}`);
      }

      console.log('Created note record:', noteData.id);

      // Log the file upload preparation
      await supabase
        .from('processing_logs')
        .insert({
          recording_id: recordingData.id,
          note_id: noteData.id,
          stage: 'upload_preparation',
          message: 'Creating database records for upload',
          details: { 
            fileName: file.name, 
            fileType: file.type, 
            fileSize: `${Math.round(file.size / 1024 / 1024 * 100) / 100} MB`,
            isVideo: isVideoFile,
            isAudio: isAudioFile
          },
          status: 'success'
        });

      setUploadProgress(40);

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        
        // Log the upload error
        await supabase
          .from('processing_logs')
          .insert({
            recording_id: recordingData.id,
            note_id: noteData.id,
            stage: 'upload_error',
            message: 'Error uploading file to storage',
            details: { error: uploadError.message },
            status: 'error'
          });
          
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Log the successful upload
      await supabase
        .from('processing_logs')
        .insert({
          recording_id: recordingData.id,
          note_id: noteData.id,
          stage: 'file_uploaded',
          message: `File uploaded successfully to storage`,
          details: { 
            filePath,
            fileType: file.type, 
            fileSize: `${Math.round(file.size / 1024 / 1024 * 100) / 100} MB` 
          },
          status: 'success'
        });

      console.log('File uploaded successfully');
      setUploadProgress(80);

      if (initiateTranscription) {
        // Determine if we need to process this as a video file
        if (isVideoFile) {
          // Log that we're starting video processing
          await supabase
            .from('processing_logs')
            .insert({
              recording_id: recordingData.id,
              note_id: noteData.id,
              stage: 'extraction_started',
              message: 'Video file detected, queuing for audio extraction',
              details: { fileType: file.type },
              status: 'info'
            });
        }

        // Start the transcription process
        const { error: invocationError } = await supabase.functions.invoke(
          'transcribe-upload',
          {
            body: {
              recordingId: recordingData.id,
              noteId: noteData.id,
              filePath: filePath,
              videoFile: isVideoFile
            }
          }
        );

        if (invocationError) {
          console.error('Error starting transcription process:', invocationError);
          
          // Log the transcription initiation error
          await supabase
            .from('processing_logs')
            .insert({
              recording_id: recordingData.id,
              note_id: noteData.id,
              stage: 'transcription_initiation',
              message: 'Error starting transcription process',
              details: { error: invocationError.message },
              status: 'error'
            });
            
          throw new Error(`Failed to start transcription: ${invocationError.message}`);
        }

        // Log the successful transcription initiation
        await supabase
          .from('processing_logs')
          .insert({
            recording_id: recordingData.id,
            note_id: noteData.id,
            stage: 'transcription_initiation',
            message: 'Transcription process started successfully',
            status: 'success'
          });

        console.log('Transcription process initiated');
      }

      setUploadProgress(100);
      return { noteId: noteData.id, recordingId: recordingData.id };
    } catch (error) {
      console.error('File processing error:', error);
      throw error;
    } finally {
      setUploadProgress(0);
    }
  };

  return { processFileUpload, uploadProgress };
};
