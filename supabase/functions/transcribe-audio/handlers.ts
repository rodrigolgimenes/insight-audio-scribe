
import { createSupabaseClient } from './utils/clientUtils.ts';
import { processTranscription } from './transcriptionService.ts';
import { updateTranscriptionStatus, handleTranscriptionError } from './statusUpdater.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface TranscriptionParams {
  noteId: string;
  recordingId?: string;
  duration?: number;
  isLargeFile?: boolean;
  isRetry?: boolean;
  audioUrl?: string;
  isChunkedTranscription?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}

export async function handleTranscription(params: TranscriptionParams): Promise<string> {
  const { noteId, recordingId, audioUrl } = params;
  const supabase = createSupabaseClient();

  try {
    // Set initial processing status if not a retry
    if (!params.isRetry) {
      await updateTranscriptionStatus(noteId, 'processing', 10);
    }

    // Load audio file
    let audioBlob: Blob;
    let filePath: string;

    if (audioUrl) {
      // If audio URL is provided directly
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio from ${audioUrl}`);
      }
      audioBlob = await response.blob();
      filePath = audioUrl;
    } else {
      // Get recording data to find the audio file path
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .select('file_path, id, status, task_id')
        .eq('id', recordingId)
        .single();

      if (recordingError) {
        throw new Error(`Failed to find recording: ${recordingError.message}`);
      }

      // Log the current recording status for debugging
      console.log('[transcribe-audio] Recording current state:', {
        id: recording.id,
        status: recording.status,
        task_id: recording.task_id || 'null'
      });

      filePath = recording.file_path;
      
      // Download file from storage
      console.log('[transcribe-audio] Downloading file:', filePath);
      const { data, error: downloadError } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (downloadError) {
        throw new Error(`Failed to download audio file: ${downloadError.message}`);
      }

      audioBlob = data;
    }

    console.log('[transcribe-audio] File downloaded successfully, size:', `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log('[transcribe-audio] Arquivo baixado com sucesso: Tamanho:', `${(audioBlob.size / (1024 * 1024)).toFixed(2)}MB`);

    // Process the transcription
    await updateTranscriptionStatus(noteId, 'processing', 20);
    console.log('[transcribe-audio] Dados e áudio recuperados:', { noteId, audioSize: `${(audioBlob.size / (1024 * 1024)).toFixed(2)}MB` });
    
    // Process transcription
    await processTranscription(noteId, audioBlob, params.isRetry);
    
    return "Transcription process started successfully";
  } catch (error) {
    console.error('[transcribe-audio] Erro durante processamento:', error);
    
    // Handle the error properly
    await handleTranscriptionError(noteId, error);
    throw error;
  }
}
