
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

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

    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    console.log('FFmpeg loaded');

    // Convert file to ArrayBuffer and write to FFmpeg's virtual filesystem
    const arrayBuffer = await (file as File).arrayBuffer();
    const inputFileName = 'input.' + (file as File).name.split('.').pop();
    const outputFileName = 'output.mp3';
    
    ffmpeg.writeFile(inputFileName, new Uint8Array(arrayBuffer));
    console.log('File written to FFmpeg filesystem');

    // Run FFmpeg command to convert to MP3
    await ffmpeg.exec([
      '-i', inputFileName,
      '-vn', // Disable video if present
      '-acodec', 'libmp3lame',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '128k',
      outputFileName
    ]);
    console.log('FFmpeg conversion completed');

    // Read the converted file
    const data = await ffmpeg.readFile(outputFileName);
    const mp3Blob = new Blob([data], { type: 'audio/mpeg' });
    console.log('Converted file read from FFmpeg filesystem');

    // Upload to storage with .mp3 extension
    const filePath = `${recordingId}/${crypto.randomUUID()}.mp3`;
    
    const { error: uploadError } = await supabase.storage
      .from('audio_recordings')
      .upload(filePath, mp3Blob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio_recordings')
      .getPublicUrl(filePath);

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

    // Get transcription
    const transcription = await transcribeAudio(mp3Blob, openAIApiKey);
    
    // Process with GPT
    const processedContent = await processWithGPT(transcription.text, openAIApiKey);

    // Update recording with transcription
    await updateRecordingWithTranscription(supabase, recordingId as string, transcription.text, processedContent);

    // Create note
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

async function transcribeAudio(audioFile: Blob, openAIApiKey: string) {
  console.log('Preparing audio file for transcription...');
  const openAIFormData = new FormData();
  openAIFormData.append('file', audioFile);
  openAIFormData.append('model', 'whisper-1');
  openAIFormData.append('language', 'pt');

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
    throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
  }

  return await openAIResponse.json();
}

async function processWithGPT(transcriptionText: string, openAIApiKey: string) {
  console.log('Processing transcription with GPT-4...');
  const gptPrompt = `Please analyze the following meeting transcript and provide a structured response with the following sections:

1. Summary
2. Key Points
3. Action Items
4. Next Steps

Transcript:
${transcriptionText}

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
  return gptData.choices[0].message.content;
}

async function updateRecordingWithTranscription(
  supabase: any, 
  recordingId: string, 
  transcriptionText: string, 
  processedContent: string
) {
  const { error: finalUpdateError } = await supabase
    .from('recordings')
    .update({
      transcription: transcriptionText,
      summary: processedContent,
      status: 'completed'
    })
    .eq('id', recordingId);

  if (finalUpdateError) {
    console.error('Error updating recording:', finalUpdateError);
    throw new Error(`Failed to update recording: ${finalUpdateError.message}`);
  }
}

async function createNoteFromTranscription(
  supabase: any, 
  recordingId: string, 
  transcriptionText: string, 
  processedContent: string
) {
  const { data: recordingData } = await supabase
    .from('recordings')
    .select('user_id')
    .eq('id', recordingId)
    .single();

  if (!recordingData) {
    throw new Error('Recording not found');
  }

  const { error: noteError } = await supabase
    .from('notes')
    .insert({
      user_id: recordingData.user_id,
      recording_id: recordingId,
      title: `Note from ${new Date().toLocaleString()}`,
      processed_content: processedContent,
      original_transcript: transcriptionText,
    });

  if (noteError) {
    console.error('Error creating note:', noteError);
    throw new Error(`Failed to create note: ${noteError.message}`);
  }
}
