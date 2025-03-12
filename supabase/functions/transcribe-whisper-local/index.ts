
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const { audioData } = await req.json();
    
    if (!audioData) {
      throw new Error('Audio data is required');
    }

    console.log('Received audio data, preparing for transcription...');

    // Decode base64 audio data
    const binaryAudio = base64Decode(audioData);

    // Create temporary file for the audio
    const tempAudioPath = await Deno.makeTempFile({ suffix: '.wav' });
    await Deno.writeFile(tempAudioPath, binaryAudio);

    console.log('Saved audio to temporary file:', tempAudioPath);

    try {
      // Execute whisper binary using Deno subprocess
      const whisperProcess = new Deno.Command("./whisper", {
        args: [
          tempAudioPath,
          "--model", "small",
          "--output_format", "txt",
          "--output_dir", "./temp"
        ],
      });

      console.log('Executing whisper command...');
      
      const output = await whisperProcess.output();
      
      // Read the transcription from the output file
      const transcriptionPath = `${tempAudioPath}.txt`;
      const transcriptionText = await Deno.readTextFile(transcriptionPath);

      console.log('Transcription completed successfully');

      // Clean up temporary files
      await Deno.remove(tempAudioPath);
      await Deno.remove(transcriptionPath);

      return new Response(
        JSON.stringify({ success: true, transcription: transcriptionText }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (execError) {
      console.error('Error executing whisper:', execError);
      
      // Provide fallback using OpenAI API if whisper binary fails
      console.log('Falling back to OpenAI Whisper API...');
      
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured and local whisper failed');
      }

      // Create form data for OpenAI API
      const formData = new FormData();
      formData.append('file', new Blob([binaryAudio], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');

      const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`
        },
        body: formData
      });

      if (!openAIResponse.ok) {
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
      }

      const result = await openAIResponse.json();
      return new Response(
        JSON.stringify({ success: true, transcription: result.text }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
