
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// OpenAI API key for Whisper transcription
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, recordingData } = await req.json();
    
    if (!audioData) {
      throw new Error('Audio data is missing from the request');
    }

    console.log('Processing audio data:', {
      recordingInfo: recordingData ? 'Present' : 'Absent',
      audioDataSize: audioData.length,
      type: typeof audioData
    });

    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: recordingData?.mimeType || 'audio/webm' });

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = 'webm';
    const fileName = `transcriptions/${timestamp}-recording.${fileExtension}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio-recordings')
      .upload(fileName, blob, {
        contentType: recordingData?.mimeType || 'audio/webm',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Error uploading audio: ${uploadError.message}`);
    }
    
    console.log('Audio uploaded successfully:', uploadData);
    
    // Get public URL of the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('audio-recordings')
      .getPublicUrl(fileName);
    
    // Create entry in transcriptions table
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        audio_url: publicUrl,
        content: 'Processing...',
        duration_ms: recordingData?.duration || 0,
        status: 'processing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (transcriptionError) {
      throw new Error(`Error creating transcription record: ${transcriptionError.message}`);
    }
    
    console.log('Transcription record created:', transcriptionData.id);
    
    // Process transcription using OpenAI Whisper API
    const transcriptionPromise = processTranscription(
      transcriptionData.id,
      blob,
      recordingData?.mimeType || 'audio/webm'
    );
    
    // Return response immediately to the client
    return new Response(
      JSON.stringify({
        success: true,
        transcriptionId: transcriptionData.id,
        message: "Transcription process started. Check status using the transcription ID.",
        transcription: "Processing your audio. Please wait..."
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

async function processTranscription(transcriptionId: string, audioBlob: Blob, mimeType: string) {
  try {
    console.log(`Starting transcription process for ID: ${transcriptionId}`);
    
    // If no OpenAI API key, use simulation mode
    if (!OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using simulation mode');
      
      // Wait 3 seconds to simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update with simulated text
      const { error } = await supabase
        .from('transcriptions')
        .update({
          content: "This is a simulated transcription. For actual transcription, please provide an OpenAI API key.",
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', transcriptionId);
      
      if (error) {
        throw new Error(`Error updating transcription: ${error.message}`);
      }
      
      return;
    }
    
    // Convert audio blob to file for OpenAI API
    const formData = new FormData();
    
    // Ensure audio is in a format Whisper accepts
    if (!mimeType.includes('mp3') && !mimeType.includes('wav') && !mimeType.includes('webm')) {
      console.log('Converting audio to supported format');
      // OpenAI Whisper accepts mp3, mp4, mpeg, mpga, m4a, wav, and webm
      // We'll use webm as our default
      formData.append('file', new Blob([audioBlob], { type: 'audio/webm' }), 'audio.webm');
    } else {
      formData.append('file', audioBlob, 'audio.webm');
    }
    
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Portuguese language
    formData.append('response_format', 'json');
    
    // Call OpenAI's Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Transcription received from OpenAI');
    
    // Update transcription with the text
    const { error } = await supabase
      .from('transcriptions')
      .update({
        content: result.text,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', transcriptionId);
    
    if (error) {
      throw new Error(`Error updating transcription: ${error.message}`);
    }
    
    console.log('Transcription completed successfully');
    
  } catch (error) {
    console.error('Error in processTranscription:', error);
    
    // Update transcription with error
    await supabase
      .from('transcriptions')
      .update({
        status: 'error',
        error_message: error.message || 'Unknown error occurred during transcription'
      })
      .eq('id', transcriptionId);
  }
}
