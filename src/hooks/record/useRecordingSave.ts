
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { chunkedTranscriptionService } from "@/services/transcription/ChunkedTranscriptionService";
import { toast as sonnerToast } from "sonner";

export const useRecordingSave = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");

  const saveRecording = async (
    isRecording: boolean,
    handleStopRecording: () => Promise<{ blob?: Blob | null; duration?: number } | undefined | void>,
    mediaStream: MediaStream | null,
    audioUrl: string | null,
    recordedDuration: number = 0
  ) => {
    try {
      let recordingResult;
      let audioBlob: Blob | null = null;
      let finalDuration = recordedDuration;

      // First stop recording if still active
      if (isRecording) {
        recordingResult = await handleStopRecording();
        
        // Get blob and duration from the result if available
        if (recordingResult?.blob) {
          audioBlob = recordingResult.blob;
        }
        
        if (recordingResult?.duration) {
          finalDuration = recordingResult.duration;
        }
      } else if (audioUrl) {
        // If not recording but have audioUrl, fetch the blob
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      }

      // Validate we have audio data
      if (!audioBlob) {
        throw new Error('No audio data available to save');
      }

      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage("Initializing...");

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Stop any active media tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      // Convert duration to milliseconds for database
      const durationInMs = Math.round(finalDuration * 1000);
      console.log('Recording duration to save (ms):', durationInMs);

      // Create initial recording entry
      setProcessingProgress(5);
      setProcessingStage("Creating recording entry...");

      // Generate a unique file path for this recording
      const fileName = `${user.id}/${Date.now()}.mp3`;

      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: durationInMs,
          user_id: user.id,
          status: 'pending',
          file_path: fileName  // Added file_path field
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      console.log('Recording entry created:', recordingData);
      
      // Show initial toast notification for longer process
      sonnerToast.info("Processing your recording", {
        description: "This may take a few minutes for larger files",
        duration: 5000, // Increased duration to give feedback longer
      });
      
      // Process audio with our enhanced service that handles compression and chunking
      // We'll add a small delay before processing to ensure database operations complete
      setTimeout(async () => {
        try {
          // Start transcription process immediately with high priority
          const transcriptionResult = await chunkedTranscriptionService.transcribeAudio(
            recordingData.id,
            audioBlob,
            finalDuration,
            (progress, stage) => {
              setProcessingProgress(progress);
              setProcessingStage(stage);
            }
          );
          
          console.log('Transcription initiation result:', transcriptionResult);
          
          // Force invalidation of any cached queries to ensure UI updates
          // This happens in a background task to not block the user
          if (transcriptionResult.noteId) {
            try {
              await supabase
                .from('notes')
                .update({ 
                  processing_progress: 15, // Set an initial progress to show activity
                  status: 'processing'
                })
                .eq('id', transcriptionResult.noteId);
              
              console.log('Updated note status to ensure processing starts');
            } catch (updateError) {
              console.error('Error updating note status:', updateError);
            }
          }
        } catch (error) {
          console.error('Background transcription error:', error);
        }
      }, 500); // Small delay to ensure database consistency
      
      // Navigate to dashboard immediately after saving
      toast({
        title: "Recording Saved",
        description: "Your recording is being processed in the background",
      });
      
      navigate("/app");
      
    } catch (error) {
      console.error('Error saving recording:', error);
      setIsProcessing(false);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error saving recording",
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
