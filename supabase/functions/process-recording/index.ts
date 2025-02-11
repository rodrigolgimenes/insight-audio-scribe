
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
      throw new Error(`Failed to download audio: ${downloadError.message}`);
    }

    if (!audioData) {
      console.error('No audio data found');
      throw new Error('No audio data found');
    }

    console.log('Successfully downloaded audio file');

    // Create FormData for OpenAI
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

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

    // Update recording with transcription
    console.log('Updating recording with transcription...');
    const { error: transcriptionUpdateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcriptionResult.text,
        status: 'transcribed'
      })
      .eq('id', recordingId);

    if (transcriptionUpdateError) {
      console.error('Error updating transcription:', transcriptionUpdateError);
      throw new Error(`Failed to save transcription: ${transcriptionUpdateError.message}`);
    }

    // Process with GPT
    console.log('Processing transcription with GPT...');
    const gptPrompt = `Please analyze the following transcript and provide a structured response with:

1. Summary
2. Key Points
3. Action Items
4. Next Steps

Transcript:
${transcriptionResult.text}

Please format your response in a clear, structured way with headers for each section.`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: gptPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      console.error('GPT processing error:', errorData);
      throw new Error(`GPT processing failed: ${errorData.error?.message || gptResponse.statusText}`);
    }

    const gptResult = await gptResponse.json();
    const processedContent = gptResult.choices[0].message.content;
    console.log('GPT processed content:', processedContent.substring(0, 100) + '...');

    // Update recording with processed content and create note
    console.log('Creating note with processed content...');
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: recording.user_id,
        recording_id: recordingId,
        title: recording.title || `Note from ${new Date().toLocaleString()}`,
        original_transcript: transcriptionResult.text,
        processed_content: processedContent,
      });

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    // Update recording status to completed
    const { error: finalUpdateError } = await supabase
      .from('recordings')
      .update({
        status: 'completed',
        summary: processedContent,
      })
      .eq('id', recordingId);

    if (finalUpdateError) {
      console.error('Error updating recording status:', finalUpdateError);
      throw new Error(`Failed to update recording status: ${finalUpdateError.message}`);
    }

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Recording processed successfully',
        transcription: transcriptionResult.text,
        processedContent
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
