
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    // Parse request body ONCE and store it
    const payload = await req.json();
    console.log('[transcribe-audio] Received payload:', payload);

    const { recordingId } = payload;
    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recording data
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      console.error('[transcribe-audio] Error getting recording:', recordingError);
      throw new Error('Recording not found');
    }

    console.log('[transcribe-audio] Found recording:', recording);

    // Get note data
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('recording_id', recordingId)
      .single();

    if (noteError || !note) {
      console.error('[transcribe-audio] Error getting note:', noteError);
      throw new Error('Note not found');
    }

    console.log('[transcribe-audio] Found note:', note);

    // Update note status to processing
    await supabase
      .from('notes')
      .update({ 
        status: 'processing',
        processing_progress: 25 
      })
      .eq('id', note.id);

    // Download audio file
    console.log('[transcribe-audio] Downloading audio file:', recording.file_path);
    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from('audio_recordings')
      .download(recording.file_path);

    if (downloadError || !audioData) {
      console.error('[transcribe-audio] Error downloading audio:', downloadError);
      throw new Error('Failed to download audio file');
    }

    console.log('[transcribe-audio] Audio file downloaded successfully');

    // Update note status to transcribing
    await supabase
      .from('notes')
      .update({ 
        status: 'transcribing',
        processing_progress: 50 
      })
      .eq('id', note.id);

    // Convert audio to correct format if needed
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });

    // Prepare form data for OpenAI
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    console.log('[transcribe-audio] Sending to OpenAI');

    // Send to OpenAI for transcription
    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('[transcribe-audio] OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const transcription = await openAIResponse.json();
    console.log('[transcribe-audio] Transcription received');

    // Update recording with transcription
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
        status: 'completed',
        processing_progress: 100,
        original_transcript: transcription.text
      })
      .eq('id', note.id);

    console.log('[transcribe-audio] Process completed successfully');

    return new Response(
      JSON.stringify({ success: true }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
