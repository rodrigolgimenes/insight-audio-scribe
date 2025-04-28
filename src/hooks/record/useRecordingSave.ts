import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

export const useRecordingSave = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");

  const validateAudioData = async (blob: Blob | null): Promise<boolean> => {
    if (!blob) return false;
    if (blob.size === 0) return false;
    
    // Additional validation - check if the blob is actually audio data
    const validAudioTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    return validAudioTypes.includes(blob.type);
  };

  const saveRecording = async (
    isRecording: boolean,
    handleStopRecording: () => Promise<{ blob?: Blob | null; duration?: number } | undefined | void>,
    mediaStream: MediaStream | null,
    audioUrl: string | null,
    recordedDuration: number = 0
  ) => {
    console.log('[useRecordingSave] Starting save process with params:', {
      isRecording,
      hasMediaStream: !!mediaStream,
      hasAudioUrl: !!audioUrl,
      recordedDuration
    });

    try {
      setIsProcessing(true);
      setProcessingProgress(5);
      setProcessingStage("Preparing audio data...");
      
      // Validate user authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      let recordingResult;
      let audioBlob: Blob | null = null;
      let finalDuration = recordedDuration;

      // If still recording, stop it first
      if (isRecording) {
        setProcessingStage("Stopping recording...");
        console.log('[useRecordingSave] Stopping active recording');
        
        recordingResult = await handleStopRecording();
        console.log('[useRecordingSave] Stop recording result:', recordingResult);
        
        // Add a small delay after stopping
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!recordingResult) {
          throw new Error('Failed to stop recording');
        }
        
        if (recordingResult.blob) {
          audioBlob = recordingResult.blob;
        }
        
        if (recordingResult.duration) {
          finalDuration = recordingResult.duration;
        }
      } else if (audioUrl) {
        setProcessingStage("Reading audio data...");
        try {
          console.log('[useRecordingSave] Fetching audio from URL');
          const response = await fetch(audioUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio data: ${response.statusText}`);
          }
          audioBlob = await response.blob();
        } catch (error) {
          console.error('[useRecordingSave] Error fetching audio data:', error);
          throw new Error('Failed to read audio data');
        }
      }

      // Validate audio blob
      const isValidAudio = await validateAudioData(audioBlob);
      if (!isValidAudio) {
        throw new Error('Invalid or corrupted audio data');
      }

      console.log('[useRecordingSave] Audio validation passed:', {
        blobSize: audioBlob?.size,
        blobType: audioBlob?.type,
        durationMs: finalDuration * 1000
      });

      setProcessingProgress(20);
      setProcessingStage("Initializing upload...");

      // Stop media stream if still active
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      const durationInMs = Math.round(finalDuration * 1000);
      console.log('Recording duration to save (ms):', durationInMs);

      setProcessingProgress(30);
      setProcessingStage("Creating recording entry...");

      // IMPORTANT: Use .mp3 extension to ensure correct content type detection
      const fileName = `${user.id}/${Date.now()}.mp3`;

      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: durationInMs,
          user_id: user.id,
          status: 'uploading',
          file_path: fileName,
          needs_compression: true
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      if (!recordingData) {
        throw new Error('Failed to create recording entry');
      }

      console.log('Recording entry created:', recordingData);
      
      setProcessingProgress(50);
      setProcessingStage("Uploading audio...");
      
      // Upload the original audio file without compression
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      setProcessingProgress(75);
      setProcessingStage("Creating note...");

      // Create note entry
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          recording_id: recordingData.id,
          title: `Recording ${new Date().toLocaleString()}`,
          processed_content: '',
          status: 'pending',
          processing_progress: 0
        })
        .select()
        .single();

      if (noteError) {
        console.error('Error creating note:', noteError);
        throw new Error(`Failed to create note: ${noteError.message}`);
      }

      if (!noteData) {
        throw new Error('Failed to create note entry');
      }

      setProcessingProgress(90);
      setProcessingStage("Starting background processing...");

      // Start background processing
      const { error: processError } = await supabase.functions.invoke('process-recording', {
        body: { 
          recordingId: recordingData.id,
          noteId: noteData.id,
          priority: 'high',
          startImmediately: true
        },
      });

      if (processError) {
        console.error('Error starting processing:', processError);
        sonnerToast.warning("Recording saved, but processing may be delayed", {
          description: "The system will try to process automatically soon"
        });
      } else {
        sonnerToast.success("Recording saved successfully!", {
          description: "Processing will begin shortly"
        });
      }

      navigate("/app");
      
    } catch (error) {
      console.error('[useRecordingSave] Error:', error);
      setIsProcessing(false);
      
      toast({
        title: "Error Saving Recording",
        description: error instanceof Error ? error.message : "Failed to save recording",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStage("");
    }
  };

  return { 
    saveRecording, 
    isProcessing,
    processingProgress,
    processingStage
  };
};
