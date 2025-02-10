
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { convertToMp3 } from './audioProcessing.ts';
import { transcribeAudio, processWithGPT } from './openAI.ts';
import { 
  uploadToStorage, 
  updateRecordingWithTranscription, 
  createNoteFromTranscription 
} from './supabaseOperations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting file processing...');
    const formData = await req.formData();
    const file = formData.get('file');
    const recordingId = formData.get('recordingId');
    const duration = formData.get('duration');

    if (!file || !recordingId) {
      console.error('Missing required parameters:', { file: !!file, recordingId: !!recordingId });
      throw new Error('No file uploaded or missing recordingId');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize FFmpeg and convert to MP3
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    console.log('FFmpeg loaded');

    const arrayBuffer = await (file as File).arrayBuffer();
    const inputFileName = 'input.' + (file as File).name.split('.').pop();
    
    const convertedData = await convertToMp3(ffmpeg, new Uint8Array(arrayBuffer), inputFileName);
    const mp3Blob = new Blob([convertedData], { type: 'audio/mpeg' });
    console.log('Audio conversion completed');

    // Upload to storage with .mp3 extension
    const filePath = `${recordingId}/${crypto.randomUUID()}.mp3`;
    const { data: { publicUrl } } = await uploadToStorage(supabase, filePath, mp3Blob);

    // Update recording with file path, duration and status
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        file_path: filePath,
        audio_url: publicUrl,
        status: 'transcribing',
        duration: duration ? parseInt(duration.toString()) : null
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Error updating recording:', updateError);
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    // Get transcription and process with GPT
    const transcription = await transcribeAudio(mp3Blob, openAIApiKey);
    const processedContent = await processWithGPT(transcription.text, openAIApiKey);

    // Update recording and create note
    await updateRecordingWithTranscription(supabase, recordingId as string, transcription.text, processedContent);
    await createNoteFromTranscription(supabase, recordingId as string, transcription.text, processedContent);

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription: transcription.text,
        processedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-upload function:', error);
    
    try {
      const formData = await req.formData();
      const recordingId = formData.get('recordingId');
      if (recordingId) {
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
      }
    } catch (updateError) {
      console.error('Failed to update recording status to error:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
