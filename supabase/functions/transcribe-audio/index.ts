
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function downloadWithRetry(supabase: any, filePath: string, maxAttempts = 12): Promise<Blob> {
  let attemptCount = 0;
  const baseDelay = 5000; // 5 segundos de delay inicial
  
  while (attemptCount < maxAttempts) {
    try {
      console.log(`[transcribe-audio] Download attempt ${attemptCount + 1} for file: ${filePath}`);
      
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data received from storage');
      }

      console.log(`[transcribe-audio] Download successful on attempt ${attemptCount + 1}`);
      return data;
    } catch (error) {
      console.error(`[transcribe-audio] Download attempt ${attemptCount + 1} failed:`, error);
      
      if (attemptCount + 1 === maxAttempts) {
        throw new Error(`Failed to download file after ${maxAttempts} attempts`);
      }

      // Delay exponencial com jitter
      const jitter = Math.random() * 1000;
      const delay = (baseDelay * Math.pow(2, attemptCount)) + jitter;
      console.log(`[transcribe-audio] Waiting ${Math.round(delay/1000)}s before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attemptCount++;
    }
  }

  throw new Error('Download failed after all attempts');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId } = await req.json();
    console.log('Starting transcription process for recording:', recordingId);
    
    if (!recordingId) {
      throw new Error('Recording ID is required');
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

    console.log('[transcribe-audio] Starting download with retry...');
    const audioData = await downloadWithRetry(supabase, recording.file_path);
    console.log('[transcribe-audio] File downloaded successfully');

    // Convert Blob to File for OpenAI API
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    console.log('[transcribe-audio] Sending to OpenAI...');
    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
    }

    const transcription = await openAIResponse.json();
    
    if (!transcription.text) {
      throw new Error('No transcription text received from OpenAI');
    }

    // Update recording status
    await supabase
      .from('recordings')
      .update({
        status: 'completed',
        transcription: transcription.text
      })
      .eq('id', recordingId);

    // Update note with transcription
    await supabase
      .from('notes')
      .update({
        original_transcript: transcription.text
      })
      .eq('recording_id', recordingId);

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
