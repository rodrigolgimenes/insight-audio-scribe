
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface SaveRecordingOptions {
  session: Session | null;
  isRecording: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  handleStopRecording: () => Promise<void>;
  resetRecording: () => void;
}

export const useSaveRecording = ({
  session,
  isRecording,
  audioUrl,
  mediaStream,
  handleStopRecording,
  resetRecording,
}: SaveRecordingOptions) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);

  const handleSaveRecording = async () => {
    console.log('[useSaveRecording] Starting save recording process');
    
    if (isSaveInProgress) {
      console.log('[useSaveRecording] Save already in progress, returning');
      return false;
    }

    if (!session?.user?.id) {
      console.error('[useSaveRecording] No user session found');
      toast({
        title: "Error",
        description: "You must be logged in to save recordings.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('[useSaveRecording] Setting save in progress');
      setIsSaveInProgress(true);

      if (isRecording) {
        console.log('[useSaveRecording] Recording in progress, stopping');
        await handleStopRecording();
      }

      if (!audioUrl && !mediaStream) {
        console.error('[useSaveRecording] No audio data available');
        throw new Error('No audio data available');
      }

      // Get audio data as blob
      let audioBlob: Blob;
      if (audioUrl) {
        try {
          console.log('[useSaveRecording] Getting audio data from URL');
          const response = await fetch(audioUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch audio data');
          }
          audioBlob = await response.blob();
          console.log('[useSaveRecording] Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type
          });
        } catch (error) {
          console.error('[useSaveRecording] Error getting audio blob:', error);
          throw new Error('Failed to get audio data');
        }
      } else {
        throw new Error('No audio URL available');
      }

      const timestamp = Date.now();
      const fileName = `${session.user.id}/${timestamp}.webm`;
      const recordingTitle = `Recording ${new Date().toLocaleString()}`;

      console.log('[useSaveRecording] Creating recording entry with:', {
        title: recordingTitle,
        file_path: fileName,
        user_id: session.user.id
      });

      // First create recording entry
      const { data: recordingData, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          title: recordingTitle,
          file_path: fileName,
          user_id: session.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (recordingError) {
        console.error('[useSaveRecording] Error creating recording:', {
          error: recordingError,
          details: recordingError.details,
          message: recordingError.message,
          hint: recordingError.hint
        });
        throw new Error(`Failed to create recording entry: ${recordingError.message}`);
      }

      console.log('[useSaveRecording] Recording entry created:', recordingData);

      // Upload the audio file
      console.log('[useSaveRecording] Uploading audio file');
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('[useSaveRecording] Error uploading audio:', uploadError);
        // Clean up recording entry if upload fails
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error('Failed to upload audio file');
      }

      console.log('[useSaveRecording] Audio file uploaded successfully');

      // Create note entry
      console.log('[useSaveRecording] Creating note entry');
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          title: recordingTitle,
          recording_id: recordingData.id,
          user_id: session.user.id,
          status: 'pending',
          processing_progress: 0,
          processed_content: ''
        })
        .select()
        .single();

      if (noteError) {
        console.error('[useSaveRecording] Error creating note:', {
          error: noteError,
          details: noteError.details,
          message: noteError.message,
          hint: noteError.hint
        });
        
        // Cleanup the recording entry and uploaded file if note creation fails
        console.log('[useSaveRecording] Cleaning up due to note creation failure');
        await Promise.all([
          supabase.storage.from('audio_recordings').remove([fileName]),
          supabase.from('recordings').delete().eq('id', recordingData.id)
        ]);
          
        throw new Error(`Failed to create note entry: ${noteError.message}`);
      }

      console.log('[useSaveRecording] Note entry created:', noteData);

      // Update the queryClient to force a refresh
      console.log('[useSaveRecording] Invalidating queries');
      await queryClient.invalidateQueries({ queryKey: ['notes'] });

      // Start processing in background
      console.log('[useSaveRecording] Starting background processing');
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { 
            recordingId: recordingData.id,
            noteId: noteData.id
          }
        });

      if (processError) {
        console.error('[useSaveRecording] Error starting processing:', {
          error: processError,
          details: processError.details,
          message: processError.message,
          context: processError.context
        });
        toast({
          title: "Warning",
          description: "Recording saved but processing may be delayed. It will retry automatically.",
          variant: "destructive",
        });
      }

      // Add a small delay before closing the modal
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('[useSaveRecording] Save completed successfully');
      toast({
        title: "Success",
        description: "Recording saved successfully! Processing will begin shortly.",
      });

      // Reset recording state
      resetRecording();

      // If we're not on the dashboard, navigate to it
      if (location.pathname !== '/app') {
        navigate('/app');
      }

      return true;
      
    } catch (error) {
      console.error('[useSaveRecording] Error in handleSaveRecording:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsSaveInProgress(false);
      console.log('[useSaveRecording] Save process completed');
    }
  };

  return {
    handleSaveRecording,
    isSaveInProgress
  };
};
