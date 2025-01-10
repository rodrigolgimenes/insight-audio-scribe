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

  try {
    const { recordingId } = await req.json();
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

    console.log('Updating recording status to processing...');
    const { error: statusError } = await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    if (statusError) {
      console.error('Error updating recording status:', statusError);
      throw new Error(`Failed to update recording status: ${statusError.message}`);
    }

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

    console.log('Downloading audio file...');
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio_recordings')
      .download(recording.file_path);

    if (downloadError) {
      console.error('Error downloading audio:', downloadError);
      // Update recording status to indicate no audio was captured
      await supabase
        .from('recordings')
        .update({
          status: 'completed',
          transcription: 'No audio was captured in this recording.',
          summary: 'This recording contains no audio data.'
        })
        .eq('id', recordingId);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No audio data available',
          transcription: 'No audio was captured in this recording.',
          processedContent: 'This recording contains no audio data.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!audioData || audioData.size === 0) {
      console.log('Audio file is empty');
      // Update recording status to indicate empty audio
      await supabase
        .from('recordings')
        .update({
          status: 'completed',
          transcription: 'The recording is empty. No audio was captured.',
          summary: 'This recording contains no audio data.'
        })
        .eq('id', recordingId);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Empty audio file',
          transcription: 'The recording is empty. No audio was captured.',
          processedContent: 'This recording contains no audio data.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully downloaded audio file');

    // Continue with normal processing for valid audio files
    console.log('Transcribing audio with Whisper...');
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json();
      console.error('Whisper API error:', errorData);
      throw new Error(`Transcription failed: ${errorData.error?.message || whisperResponse.statusText}`);
    }

    const transcription = await whisperResponse.json();
    console.log('Transcription received:', transcription.text?.substring(0, 100) + '...');

    // Update recording with transcription
    console.log('Updating recording with transcription...');
    const { error: transcriptionUpdateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcription.text,
        status: 'transcribed'
      })
      .eq('id', recordingId);

    if (transcriptionUpdateError) {
      console.error('Error updating transcription:', transcriptionUpdateError);
      throw new Error(`Failed to save transcription: ${transcriptionUpdateError.message}`);
    }

    // Process with GPT
    console.log('Processing transcription with GPT...');
    const gptPrompt = `Please analyze the following meeting transcript and provide a structured response with the following sections:

1. Summary
2. Project Background
3. Anticipated Challenges
4. Potential Solutions
5. Risks
6. Preventative Actions
7. Assigning Responsibility
8. Next Steps

Transcript:
${transcription.text}

Please format your response in a clear, structured way with headers for each section.`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: gptPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      console.error('GPT API error:', errorData);
      throw new Error(`GPT processing failed: ${errorData.error?.message || gptResponse.statusText}`);
    }

    const gptData = await gptResponse.json();
    const processedContent = gptData.choices[0].message.content;
    console.log('GPT processed content:', processedContent.substring(0, 100) + '...');

    // Update recording with processed content
    console.log('Updating recording with processed content...');
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        summary: processedContent,
        status: 'completed'
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Error updating recording:', updateError);
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    console.log('Successfully updated recording with processed content');

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription: transcription.text,
        processedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-recording function:', error);
    
    try {
      const { recordingId } = await req.json();
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