
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
      setProcessingProgress(10);
      setProcessingStage("Iniciando upload...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      const durationInMs = Math.round(finalDuration * 1000);
      console.log('Recording duration to save (ms):', durationInMs);

      setProcessingProgress(20);
      setProcessingStage("Criando registro da gravação...");

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
          needs_compression: true // Marcando que precisa de compressão
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      console.log('Recording entry created:', recordingData);
      
      setProcessingProgress(40);
      setProcessingStage("Fazendo upload do áudio...");
      
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

      setProcessingProgress(70);
      setProcessingStage("Criando nota...");

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

      setProcessingProgress(90);
      setProcessingStage("Iniciando processamento em segundo plano...");

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
        sonnerToast.warning("Gravação salva, mas o processamento pode demorar para iniciar", {
          description: "O sistema tentará processar automaticamente em breve"
        });
      } else {
        sonnerToast.success("Gravação salva!", {
          description: "O processamento começará em breve"
        });
      }

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
