
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecordingData {
  id: string;
  file_path: string;
  duration: number;
}

async function downloadLargeFile(supabase: any, bucketName: string, filePath: string, maxAttempts = 10): Promise<Uint8Array> {
  let attemptCount = 0;
  const delayBetweenAttempts = 2000; // 2 segundos entre tentativas

  while (attemptCount < maxAttempts) {
    try {
      console.log(`[downloadLargeFile] Attempt ${attemptCount + 1} to download file: ${filePath}`);
      
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        console.error(`[downloadLargeFile] Error on attempt ${attemptCount + 1}:`, error);
        throw error;
      }

      if (!data) {
        console.log(`[downloadLargeFile] No data received on attempt ${attemptCount + 1}, retrying...`);
        attemptCount++;
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error(`[downloadLargeFile] Attempt ${attemptCount + 1} failed:`, error);
      
      if (attemptCount + 1 === maxAttempts) {
        throw new Error(`File not available after ${maxAttempts} attempts: ${filePath}`);
      }

      attemptCount++;
      await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
    }
  }

  throw new Error(`Failed to download file after ${maxAttempts} attempts`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recordingId } = await req.json();

    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    console.log('[process-recording] Processing recording:', recordingId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar informações da gravação
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      console.error('[process-recording] Error fetching recording:', recordingError);
      throw new Error('Recording not found');
    }

    console.log('[process-recording] Recording data:', recording);

    // Atualizar status para processing
    const { error: updateError } = await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    if (updateError) {
      console.error('[process-recording] Error updating status:', updateError);
      throw new Error('Failed to update recording status');
    }

    // Download do arquivo com retry
    console.log('[process-recording] Downloading audio file...');
    const audioData = await downloadLargeFile(supabase, 'audio_recordings', recording.file_path);
    console.log('[process-recording] Audio file downloaded successfully');

    // Criar entrada na tabela notes
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        title: recording.title,
        recording_id: recordingId,
        user_id: recording.user_id,
        duration: recording.duration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (noteError) {
      console.error('[process-recording] Error creating note:', noteError);
      throw new Error('Failed to create note');
    }

    console.log('[process-recording] Note created:', note);

    // Iniciar transcrição em background
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log('[process-recording] Starting transcription process...');
        
        const { error: transcribeError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: note.id,
              recordingId: recordingId
            }
          });

        if (transcribeError) {
          console.error('[process-recording] Transcription error:', transcribeError);
          throw transcribeError;
        }

        console.log('[process-recording] Transcription started successfully');
      } catch (error) {
        console.error('[process-recording] Background task error:', error);
        
        // Atualizar status para error
        await supabase
          .from('recordings')
          .update({ 
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error during processing'
          })
          .eq('id', recordingId);
      }
    })());

    return new Response(
      JSON.stringify({ success: true, noteId: note.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-recording] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 200, // Mantemos 200 para evitar erro de CORS
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
