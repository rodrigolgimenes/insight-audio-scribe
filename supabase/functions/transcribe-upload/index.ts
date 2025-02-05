import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { decode as base64Decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const recordingId = formData.get('recordingId');

    if (!file || !recordingId) {
      throw new Error('No file uploaded or missing recordingId');
    }

    console.log('Processing file:', file.name, 'type:', file.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert file to audio if it's a video
    let audioFile = file;
    if (file.type.startsWith('video/')) {
      console.log('Converting video to audio...');
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Use FFmpeg to convert video to audio
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      
      ffmpeg.FS('writeFile', 'input.mp4', uint8Array);
      await ffmpeg.run('-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output.mp3');
      
      const audioData = ffmpeg.FS('readFile', 'output.mp3');
      audioFile = new File([audioData], 'audio.mp3', { type: 'audio/mpeg' });
      
      ffmpeg.FS('unlink', 'input.mp4');
      ffmpeg.FS('unlink', 'output.mp3');
    }

    console.log('Preparing audio file for transcription...');

    // Convert Blob to FormData for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('language', 'pt');

    console.log('Calling OpenAI API for transcription...');

    // Call OpenAI API for transcription
    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openAIFormData,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
    }

    const transcription = await openAIResponse.json();
    console.log('Transcription received from OpenAI');

    // Update recording with transcription
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcription.text,
        status: 'completed'
      })
      .eq('id', recordingId);

    if (updateError) {
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    // Create note entry
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        recording_id: recordingId,
        title: `Note from ${new Date().toLocaleString()}`,
        processed_content: transcription.text,
        original_transcript: transcription.text,
      });

    if (noteError) {
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcription: transcription.text 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transcribe-upload function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});