
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FASTWHISPER_API_URL = Deno.env.get('FASTWHISPER_API_URL') || 'http://localhost:8000/transcribe';

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
      recordingInfo: recordingData ? 'Present' : 'Missing',
      audioDataLength: audioData.length,
      type: typeof audioData
    });

    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: recordingData?.mimeType || 'audio/webm' });

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = 'webm';
    const fileName = `whisper-transcriptions/${timestamp}-recording.${fileExtension}`;
    
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
        content: 'Processing...', // Will be updated by the fast-whisper service
        duration_ms: recordingData?.duration || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (transcriptionError) {
      throw new Error(`Error creating transcription record: ${transcriptionError.message}`);
    }
    
    console.log('Transcription record created:', transcriptionData.id);
    
    // Send request to the fast-whisper service
    try {
      // Actually call the Python service instead of simulating it
      const response = await fetch(FASTWHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription_id: transcriptionData.id,
          audio_url: publicUrl,
          language: "pt"  // Default to Portuguese as requested
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Fast-whisper service returned error: ${response.status} ${errorData}`);
      }
      
      const responseData = await response.json();
      console.log('Fast-whisper service response:', responseData);
    } catch (fastWhisperError) {
      console.error('Error calling fast-whisper service:', fastWhisperError);
      // Don't fail the response, just log the error and update transcription status
      await supabase
        .from('transcriptions')
        .update({
          status: 'error',
          error_message: fastWhisperError.message
        })
        .eq('id', transcriptionData.id);
    }

    // Inform client that transcription was initiated successfully
    return new Response(
      JSON.stringify({
        success: true,
        transcriptionId: transcriptionData.id,
        message: "Transcription process initiated. Check status using the transcription ID.",
        transcription: "Processing your audio with fast-whisper. Please wait..."
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
