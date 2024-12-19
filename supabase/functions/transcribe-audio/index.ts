import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId } = await req.json();
    console.log('Starting transcription for recording:', recordingId);
    
    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching recording details...');
    // Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError) {
      console.error('Error fetching recording:', recordingError);
      throw new Error(`Failed to fetch recording: ${recordingError.message}`);
    }

    if (!recording) {
      throw new Error('Recording not found');
    }

    console.log('Downloading audio file...');
    // Download the audio file
    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from('audio_recordings')
      .download(recording.file_path);

    if (downloadError || !audioData) {
      console.error('Error downloading audio:', downloadError);
      throw new Error('Failed to download audio file');
    }

    console.log('Calling OpenAI API for transcription...');
    // Convert Blob to File for OpenAI API
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    // Call OpenAI API for transcription
    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
    }

    const transcription = await openAIResponse.json();

    if (!transcription.text) {
      throw new Error('No transcription text received from OpenAI');
    }

    console.log('Saving transcription to notes table...');
    // Save transcription to notes table
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: recording.user_id,
        recording_id: recordingId,
        title: recording.title,
        processed_content: transcription.text,
        original_transcript: transcription.text,
      });

    if (noteError) {
      console.error('Error saving note:', noteError);
      throw new Error(`Failed to save transcription: ${noteError.message}`);
    }

    console.log('Transcription completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        transcription: transcription.text 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        status: 400, // Changed from 500 to 400 for client errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});