
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let recordingId: string | undefined;
  
  try {
    // Parse request body once and store it
    const body = await req.json();
    recordingId = body.recordingId;
    
    console.log('Processing recording:', recordingId);
    
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

    // Update recording status to processing
    console.log('Updating recording status to processing...');
    const { error: statusError } = await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    if (statusError) {
      console.error('Error updating recording status:', statusError);
      throw new Error(`Failed to update recording status: ${statusError.message}`);
    }

    // Get recording details
    console.log('Fetching recording details...');
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      console.error('Error fetching recording:', recordingError);
      throw new Error('Recording not found');
    }

    console.log('Found recording:', recording);

    // Download the audio file
    console.log('Downloading audio file...');
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio_recordings')
      .download(recording.file_path);

    if (downloadError) {
      console.error('Error downloading audio:', downloadError);
      throw new Error(`Failed to download audio: ${downloadError.message}`);
    }

    if (!audioData) {
      console.error('No audio data found');
      throw new Error('No audio data found');
    }

    // Create FormData for OpenAI
    const formData = new FormData();
    
    // Convert audio to supported format if needed
    let finalAudioBlob = audioData;
    if (!audioData.type.includes('webm') && !audioData.type.includes('mp3')) {
      console.log('Converting audio to MP3 format...');
      finalAudioBlob = new Blob([audioData], { type: 'audio/mp3' });
    }
    
    formData.append('file', finalAudioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    // Check OpenAI quota before making the request
    console.log('Checking OpenAI API access...');
    try {
      const quotaCheckResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
      });

      if (!quotaCheckResponse.ok) {
        const errorData = await quotaCheckResponse.json();
        if (errorData.error?.type === 'insufficient_quota') {
          throw new Error('OpenAI API quota exceeded. Please check your billing details.');
        }
      }
    } catch (error) {
      console.error('OpenAI API access check failed:', error);
      throw error;
    }

    console.log('Sending audio to OpenAI for transcription...');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.json();
      console.error('OpenAI transcription error:', errorData);
      throw new Error(`Transcription failed: ${errorData.error?.message || transcriptionResponse.statusText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    console.log('Transcription received:', transcriptionResult.text?.substring(0, 100) + '...');

    if (!transcriptionResult.text) {
      throw new Error('No transcription text received');
    }

    // Update recording with transcription only
    console.log('Updating recording with transcription...');
    const { error: transcriptionUpdateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcriptionResult.text,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (transcriptionUpdateError) {
      console.error('Error updating transcription:', transcriptionUpdateError);
      throw new Error(`Failed to save transcription: ${transcriptionUpdateError.message}`);
    }

    // Create note with original transcript
    console.log('Creating note with transcription...');
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: recording.user_id,
        recording_id: recordingId,
        title: recording.title || `Note from ${new Date().toLocaleString()}`,
        original_transcript: transcriptionResult.text,
      });

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Recording processed successfully',
        transcription: transcriptionResult.text
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error('Error in process-recording function:', error);
    
    if (recordingId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('recordings')
            .update({ 
              status: 'error',
              error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
            })
            .eq('id', recordingId);
        }
      } catch (updateError) {
        console.error('Failed to update recording status to error:', updateError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isQuotaError = errorMessage.includes('quota exceeded') || errorMessage.includes('insufficient_quota');

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        isQuotaError
      }), 
      {
        status: isQuotaError ? 402 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
