
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
  let supabase: ReturnType<typeof createClient>;
  
  try {
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

    supabase = createClient(supabaseUrl, supabaseKey);

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

    if (!recording.file_path) {
      throw new Error('Recording file path is missing');
    }

    // Update recording status to processing
    console.log('Updating recording status to processing...');
    await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    // Get file URL
    console.log('Getting file URL...');
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('audio_recordings')
      .getPublicUrl(recording.file_path);

    if (urlError) {
      throw new Error(`Failed to get file URL: ${urlError.message}`);
    }

    // Download the audio file
    console.log('Downloading audio file...');
    const audioResponse = await fetch(publicUrl);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: HTTP ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log('Audio file downloaded successfully:', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    // Create FormData for OpenAI
    const formData = new FormData();
    
    // Determine file type and handle accordingly
    const fileExtension = recording.file_path.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'mp3' ? 'audio/mpeg' : 'audio/webm';
    
    console.log('Processing file with type:', {
      fileExtension,
      mimeType,
      size: audioBlob.size
    });
    
    formData.append('file', audioBlob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    // Check OpenAI quota
    console.log('Checking OpenAI API access...');
    const quotaCheckResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
    });

    if (!quotaCheckResponse.ok) {
      const errorData = await quotaCheckResponse.json();
      if (errorData.error?.type === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded');
      }
      throw new Error(`OpenAI API error: ${errorData.error?.message}`);
    }

    // Send to OpenAI for transcription
    console.log('Sending audio to OpenAI...');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.json();
      throw new Error(`Transcription failed: ${errorData.error?.message}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    
    if (!transcriptionResult.text) {
      throw new Error('No transcription text received');
    }

    console.log('Transcription received');

    // Process with GPT
    console.log('Processing with GPT...');
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Analyze this transcript and provide:
1. Summary
2. Key Points
3. Action Items
4. Next Steps

Transcript:
${transcriptionResult.text}

Format your response clearly with headers for each section.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      throw new Error(`GPT processing failed: ${errorData.error?.message}`);
    }

    const gptResult = await gptResponse.json();
    const processedContent = gptResult.choices[0].message.content;

    // Update recording
    console.log('Updating recording...');
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcriptionResult.text,
        processed_content: processedContent,
        status: 'completed',
        processed_at: new Date().toISOString(),
        audio_url: publicUrl
      })
      .eq('id', recordingId);

    if (updateError) {
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    // Create note
    console.log('Creating note...');
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: recording.user_id,
        recording_id: recordingId,
        title: recording.title || `Note from ${new Date().toLocaleString()}`,
        original_transcript: transcriptionResult.text,
        processed_content: processedContent,
        audio_url: publicUrl,
        duration: recording.duration
      });

    if (noteError) {
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recording processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-recording function:', error);
    
    if (recordingId && supabase) {
      try {
        await supabase
          .from('recordings')
          .update({ 
            status: 'error',
            error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
          })
          .eq('id', recordingId);
      } catch (updateError) {
        console.error('Failed to update recording status:', updateError);
      }
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
