
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { withRetry } from './retryUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function downloadWithRetry(supabase: any, filePath: string, maxAttempts = 12): Promise<Blob> {
  return withRetry(
    async () => {
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error('No data received from storage');
      
      return data;
    },
    {
      maxAttempts,
      baseDelay: 5000,
      shouldRetry: (error) => {
        // Add specific conditions for retrying based on error types
        const retryableErrors = [
          'network error',
          'timeout',
          'rate limit',
          'internal server error'
        ];
        return retryableErrors.some(msg => error.message.toLowerCase().includes(msg));
      }
    }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteId, recordingId } = await req.json();
    console.log('Starting transcription process for recording:', recordingId);
    
    if (!recordingId || !noteId) {
      throw new Error('Recording ID and Note ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      throw new Error('Recording not found');
    }

    // Update note status to downloading
    await supabase
      .from('notes')
      .update({ 
        status: 'processing',
        processing_progress: 25 
      })
      .eq('id', noteId);

    console.log('[transcribe-audio] Starting download with retry...');
    const audioData = await downloadWithRetry(supabase, recording.file_path);
    console.log('[transcribe-audio] File downloaded successfully');

    // Update progress after successful download
    await supabase
      .from('notes')
      .update({ 
        status: 'transcribing',
        processing_progress: 50 
      })
      .eq('id', noteId);

    // Convert Blob to File for OpenAI API
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    // Transcribe with retry
    const transcription = await withRetry(
      async () => {
        console.log('[transcribe-audio] Sending to OpenAI...');
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
        }

        return response.json();
      },
      {
        maxAttempts: 3,
        baseDelay: 10000,
        shouldRetry: (error) => {
          // Retry on rate limits or server errors
          return error.message.includes('rate limit') || 
                 error.message.includes('server error');
        }
      }
    );
    
    if (!transcription.text) {
      throw new Error('No transcription text received from OpenAI');
    }

    // Update recording and note with transcription
    await supabase.from('recordings')
      .update({
        status: 'completed',
        transcription: transcription.text
      })
      .eq('id', recordingId);

    await supabase.from('notes')
      .update({
        status: 'completed',
        processing_progress: 100,
        original_transcript: transcription.text
      })
      .eq('id', noteId);

    console.log('[transcribe-audio] Process completed successfully');

    return new Response(
      JSON.stringify({ success: true, transcription: transcription.text }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[transcribe-audio] Error:', error);
    
    // Try to update note status to error if we have the noteId
    try {
      const { noteId } = await req.json();
      if (noteId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('notes')
          .update({ 
            status: 'error',
            processing_progress: 0
          })
          .eq('id', noteId);
      }
    } catch {
      // Ignore errors in error handling
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
