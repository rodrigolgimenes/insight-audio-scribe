
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { chunkedTranscriptionService } from "@/services/transcription/ChunkedTranscriptionService";
import { toast as sonnerToast } from "sonner";
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";
import { LargeFileProcessor } from "@/utils/audio/processing/LargeFileProcessor";

// Get the Supabase URL and key from the client file
const SUPABASE_URL = "https://wbptvnuyhgstaaufzysh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHR2bnV5aGdzdGFhdWZ6eXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MjQyNTEsImV4cCI6MjA1MDIwMDI1MX0.-wzEsrbHLbcbfe3xdMixrbCH-KVtcf0TOnrwyWK6paA";

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

      if (isRecording) {
        recordingResult = await handleStopRecording();
        
        if (recordingResult?.blob) {
          audioBlob = recordingResult.blob;
        }
        
        if (recordingResult?.duration) {
          finalDuration = recordingResult.duration;
        }
      } else if (audioUrl) {
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      }

      if (!audioBlob) {
        throw new Error('No audio data available to save');
      }

      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage("Initializing...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      const durationInMs = Math.round(finalDuration * 1000);
      console.log('Recording duration to save (ms):', durationInMs);

      setProcessingProgress(5);
      setProcessingStage("Creating recording entry...");

      // IMPORTANT: Use .mp3 extension to ensure correct content type detection
      const fileName = `${user.id}/${Date.now()}.mp3`;

      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: durationInMs,
          user_id: user.id,
          status: 'pending',
          file_path: fileName
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      console.log('Recording entry created:', recordingData);
      
      // Check if this is a large file
      const isLargeFile = LargeFileProcessor.isLargeFile(audioBlob.size, durationInMs);
      if (isLargeFile) {
        sonnerToast.info("Large recording detected", {
          description: "This recording will be processed in chunks for better reliability",
          duration: 5000,
        });
      } else {
        sonnerToast.info("Processing your recording", {
          description: "This may take a few minutes",
          duration: 5000,
        });
      }

      // Compress and convert audio to MP3 before upload
      setProcessingStage("Compressing audio...");
      setProcessingProgress(15);
      
      // Debug log the original audio blob details
      console.log('Original audio format:', audioBlob.type, 'Size:', Math.round(audioBlob.size / 1024 / 1024 * 100) / 100, 'MB');
      
      // Use our new audio compressor
      let compressedBlob: Blob;
      try {
        compressedBlob = await audioCompressor.compressAudio(audioBlob, {
          targetBitrate: 32, // 32kbps for high compression
          mono: true,        // Convert to mono
          targetSampleRate: 16000 // 16kHz sample rate
        });
        
        console.log('Compressed audio format:', compressedBlob.type, 
                   'Size:', Math.round(compressedBlob.size / 1024 / 1024 * 100) / 100, 'MB',
                   'Compression ratio:', Math.round((1 - compressedBlob.size / audioBlob.size) * 100) + '%');
      } catch (compressionError) {
        console.error('Audio compression failed, using original audio:', compressionError);
        sonnerToast.warning("Audio compression failed, using original format", {
          description: "Your recording will still be saved but may be larger in size",
          duration: 3000,
        });
        
        // Use the original blob but force the MIME type to MP3
        const rawData = await audioBlob.arrayBuffer();
        compressedBlob = new Blob([rawData], { type: 'audio/mp3' });
      }
      
      // Verify the blob has the correct type
      if (!compressedBlob.type.includes('mp3') && !compressedBlob.type.includes('mpeg')) {
        console.warn('Compressed blob is not in MP3 format. Forcing MIME type to audio/mp3');
        // Force the correct MIME type if not set properly
        const rawData = await compressedBlob.arrayBuffer();
        compressedBlob = new Blob([rawData], { type: 'audio/mp3' });
        console.log('Forced MP3 blob type:', compressedBlob.type);
      }
      
      setProcessingProgress(30);
      setProcessingStage("Uploading to server...");
      
      // Upload the compressed MP3 file
      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadError = null;

      while (uploadAttempts < maxAttempts) {
        try {
          console.log(`Upload attempt ${uploadAttempts + 1}/${maxAttempts} with content type: ${compressedBlob.type}`);
          
          const { error } = await supabase.storage
            .from('audio_recordings')
            .upload(fileName, compressedBlob, {
              contentType: 'audio/mp3', // Explicitly set content type to MP3
              upsert: true // Use upsert to overwrite if needed
            });

          if (!error) {
            uploadError = null;
            break;
          }
          
          console.error(`Upload attempt ${uploadAttempts + 1} failed:`, error);
          uploadError = error;
        } catch (error) {
          console.error(`Upload attempt ${uploadAttempts + 1} exception:`, error);
          uploadError = error;
        }
        uploadAttempts++;
        if (uploadAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }

      if (uploadError) {
        console.error('All upload attempts failed:', uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message || 'Unknown error'}`);
      }
      
      console.log('Audio file uploaded successfully as MP3');
      setProcessingProgress(50);

      // Create a note for this recording
      setProcessingStage("Creating note...");
      const { data: noteData, error: noteError } = await supabase
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

      setProcessingProgress(60);
      setProcessingStage("Starting transcription...");

      // Start processing immediately with a proper async implementation
      const startProcessing = async () => {
        try {
          console.log('Starting transcription process immediately');
          
          // For large files, use the dedicated large file processing
          if (isLargeFile) {
            console.log(`Processing large file: ${compressedBlob.size / (1024 * 1024)} MB, ${durationInMs}ms`);
            
            // Call the process-recording function with high priority
            const { error: processError } = await supabase.functions.invoke('process-recording', {
              body: { 
                recordingId: recordingData.id,
                noteId: noteData.id,
                priority: 'high',
                startImmediately: true
              },
            });
            
            if (processError) {
              console.error('Failed to start immediate processing:', processError);
              // Try direct edge function call as backup
              await fetch(`${SUPABASE_URL}/functions/v1/process-recording`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ 
                  recordingId: recordingData.id,
                  noteId: noteData.id,
                  priority: 'high',
                  startImmediately: true
                }),
              });
            }
            
            // Update note status to ensure processing starts
            await supabase
              .from('notes')
              .update({ 
                processing_progress: 15,
                status: 'processing'
              })
              .eq('id', noteData.id);
            
            console.log('Updated note status to ensure large file processing starts');
          } else {
            // For smaller files, use standard transcription
            const transcriptionResult = await chunkedTranscriptionService.transcribeAudio(
              recordingData.id,
              compressedBlob,
              finalDuration,
              (progress, stage) => {
                setProcessingProgress(60 + (progress * 0.4));
                setProcessingStage(stage);
              }
            );
            
            console.log('Standard transcription initiation result:', transcriptionResult);
          }
        } catch (error) {
          console.error('Background transcription error:', error);
          sonnerToast.error("Error processing recording", {
            description: error instanceof Error ? error.message : "Unknown error",
          });
          
          // Try to update the note status on error
          try {
            await supabase
              .from('notes')
              .update({ 
                status: 'error',
                error_message: error instanceof Error ? error.message : "Unknown error"
              })
              .eq('id', noteData.id);
          } catch (updateError) {
            console.error('Failed to update note status on error:', updateError);
          }
        }
      };
      
      // Start processing immediately instead of setTimeout
      startProcessing();
      
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
