
import { createSupabaseClient } from './utils/clientUtils.ts';
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
    
    // --- 1) Chama o serviço Python para criar a task ---
    // Get the transcription service URL from environment variable
    const transcriptionServiceUrl = Deno.env.get('TRANSCRIPTION_SERVICE_URL');
    
    if (!transcriptionServiceUrl) {
      console.error('[transcribe-audio] TRANSCRIPTION_SERVICE_URL environment variable is not set');
      throw new Error('Transcription service URL is not configured');
    }
    
    console.log('[transcribe-audio] Using transcription service at:', transcriptionServiceUrl);
    
    // Generate callback URL using Supabase URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    let callbackUrl = '';
    
    if (projectRef) {
      // Make sure we have the full URL with https://
      callbackUrl = `https://${projectRef}.functions.supabase.co/on-transcription-complete`;
      console.log('[transcribe-audio] Using callback URL:', callbackUrl);
    } else {
      console.warn('[transcribe-audio] Could not generate callback URL, webhooks will not work');
    }
    
    // Create form data for the file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    
    console.log('[transcribe-audio] Iniciando transcrição...');
    await updateTranscriptionStatus(noteId, 'processing', 30);
    
    // Start transcription and get task ID - with callbackUrl as query parameter
    const apiUrl = callbackUrl 
      ? `${transcriptionServiceUrl}/api/transcribe?callback_url=${encodeURIComponent(callbackUrl)}`
      : `${transcriptionServiceUrl}/api/transcribe`;
      
    console.log('[transcribe-audio] Calling API with URL:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[transcribe-audio] Error response from transcription service:', errorText);
        
        if (response.status === 422) {
          throw new Error('Invalid audio format or missing file');
        } else {
          throw new Error(`Transcription service returned status ${response.status}: ${errorText}`);
        }
      }
      
      const result = await response.json();
      console.log('[transcribe-audio] Transcription service response:', result);
      
      if (result.error) {
        throw new Error(`Transcription failed: ${result.error}`);
      }
      
      // Use either task_id or id field from the response
      const taskId = result.task_id || result.id;
      
      if (!taskId) {
        throw new Error('Task ID is empty or invalid');
      }
      
      console.log('[transcribe-audio] Transcription task created with ID:', taskId);
      console.log('[transcribe-audio] Status:', result.status || 'unknown');
      
      // --- 2) Salva o task_id na tabela recordings ---
      if (recordingId) {
        console.log('[transcribe-audio] Saving task_id to recording:', recordingId);
        
        const { error: updateError } = await supabase
          .from('recordings')
          .update({ 
            task_id: taskId,
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', recordingId);
          
        if (updateError) {
          console.error('[transcribe-audio] Error updating task_id:', updateError);
        } else {
          console.log('[transcribe-audio] Successfully updated task_id with direct update');
        }
      }
      
      // Update note status to show it's now being transcribed by the service
      await updateTranscriptionStatus(noteId, 'transcribing', 50);
      
      return taskId;
    } catch (fetchError) {
      console.error('[transcribe-audio] Error calling transcription service:', fetchError);
      
      // Try with backup URL if primary fails
      if (transcriptionServiceUrl === 'http://167.88.42.2:8001') {
        console.log('[transcribe-audio] Trying backup transcription service');
        
        const backupResponse = await fetch('http://transcribe.reportflex.com.br/api/transcribe', {
          method: 'POST',
          body: formData,
        });
        
        if (!backupResponse.ok) {
          throw new Error(`Backup transcription service returned status ${backupResponse.status}`);
        }
        
        const backupResult = await backupResponse.json();
        const backupTaskId = backupResult.task_id || backupResult.id;
        
        if (!backupTaskId) {
          throw new Error('Backup service task ID is empty or invalid');
        }
        
        console.log('[transcribe-audio] Backup transcription task created with ID:', backupTaskId);
        
        // Update recording with backup task ID
        if (recordingId) {
          await supabase
            .from('recordings')
            .update({ 
              task_id: backupTaskId,
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', recordingId);
        }
        
        await updateTranscriptionStatus(noteId, 'transcribing', 50);
        return backupTaskId;
      }
      
      // If backup also fails or we didn't try backup, throw the original error
      throw fetchError;
    }
  } catch (error) {
    console.error('[transcribe-audio] Erro durante processamento:', error);
    
    // Handle the error properly
    await handleTranscriptionError(noteId, error);
    throw error;
  }
}
