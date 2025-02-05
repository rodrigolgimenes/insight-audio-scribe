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
    console.log('Starting file processing...');
    const formData = await req.formData();
    const file = formData.get('file');
    const recordingId = formData.get('recordingId');

    if (!file || !recordingId) {
      console.error('Missing required parameters:', { file: !!file, recordingId: !!recordingId });
      throw new Error('No file uploaded or missing recordingId');
    }

    console.log('Processing file:', file.name, 'type:', file.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle video files by accepting the audio track directly
    let audioFile = file;
    if (file.type.startsWith('video/')) {
      console.log('Processing video file as audio...');
      const arrayBuffer = await file.arrayBuffer();
      audioFile = new File([arrayBuffer], 'audio.mp3', { type: 'audio/mpeg' });
      console.log('Video processed as audio');
    }

    // Upload audio file to storage
    console.log('Uploading audio file to storage...');
    const filePath = `${recordingId}/${crypto.randomUUID()}.${audioFile.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('audio_recordings')
      .upload(filePath, audioFile, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      await supabase
        .from('recordings')
        .update({ 
          status: 'error',
          error_message: `Failed to upload file: ${uploadError.message}`
        })
        .eq('id', recordingId);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('audio_recordings')
      .getPublicUrl(filePath);

    // Update recording with file path and audio URL
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        file_path: filePath,
        audio_url: publicUrl,
        status: 'transcribing'
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Error updating recording:', updateError);
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    // Prepare audio for transcription
    console.log('Preparing audio file for transcription...');
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('language', 'pt');

    console.log('Calling OpenAI API for transcription...');
    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openAIFormData,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      
      await supabase
        .from('recordings')
        .update({ 
          status: 'error',
          error_message: `OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`
        })
        .eq('id', recordingId);
        
      throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
    }

    const transcription = await openAIResponse.json();
    console.log('Transcription received from OpenAI');

    // Process with GPT-4
    console.log('Processing transcription with GPT-4...');
    const gptPrompt = `Please analyze the following meeting transcript and provide a structured response with the following sections:

1. Summary
2. Key Points
3. Action Items
4. Next Steps

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
        model: 'gpt-4o',
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
      
      await supabase
        .from('recordings')
        .update({ 
          status: 'error',
          error_message: `GPT processing failed: ${errorData.error?.message || gptResponse.statusText}`
        })
        .eq('id', recordingId);
        
      throw new Error(`GPT processing failed: ${errorData.error?.message || gptResponse.statusText}`);
    }

    const gptData = await gptResponse.json();
    const processedContent = gptData.choices[0].message.content;

    // Update recording with transcription and processed content
    const { error: finalUpdateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcription.text,
        summary: processedContent,
        status: 'completed'
      })
      .eq('id', recordingId);

    if (finalUpdateError) {
      console.error('Error updating recording:', finalUpdateError);
      throw new Error(`Failed to update recording: ${finalUpdateError.message}`);
    }

    // Get recording data for user ID
    const { data: recordingData } = await supabase
      .from('recordings')
      .select('user_id')
      .eq('id', recordingId)
      .single();

    if (!recordingData) {
      throw new Error('Recording not found');
    }

    // Create note
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: recordingData.user_id,
        recording_id: recordingId,
        title: `Note from ${new Date().toLocaleString()}`,
        processed_content: processedContent,
        original_transcript: transcription.text,
      });

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

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