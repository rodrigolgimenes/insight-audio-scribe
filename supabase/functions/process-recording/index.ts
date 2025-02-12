
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
    const { recordingId: receivedRecordingId } = await req.json();
    recordingId = receivedRecordingId;
    
    console.log('[process-recording] Processing recording:', recordingId);
    
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
    console.log('[process-recording] Fetching recording details...');
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError) {
      console.error('[process-recording] Error fetching recording:', recordingError);
      throw new Error(`Recording fetch failed: ${recordingError.message}`);
    }

    if (!recording) {
      throw new Error('Recording not found');
    }

    console.log('[process-recording] Found recording:', {
      id: recording.id,
      file_path: recording.file_path,
      status: recording.status
    });

    if (!recording.file_path) {
      throw new Error('Recording file path is missing');
    }

    // Update recording status to processing
    console.log('[process-recording] Updating recording status to processing...');
    const { error: statusError } = await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    if (statusError) {
      console.error('[process-recording] Error updating status:', statusError);
      throw new Error(`Failed to update status: ${statusError.message}`);
    }

    // Download the audio file with retries
    console.log('[process-recording] Attempting to download audio file...');
    let audioData: Blob | null = null;
    let downloadError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[process-recording] Download attempt ${attempt}...`);
        const { data, error } = await supabase.storage
          .from('audio_recordings')
          .download(recording.file_path);

        if (error) {
          console.error(`[process-recording] Download attempt ${attempt} failed:`, error);
          downloadError = error;
          if (attempt < 3) {
            const delay = 1000 * attempt;
            console.log(`[process-recording] Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          continue;
        }

        if (!data) {
          console.error('[process-recording] No data received from storage');
          throw new Error('No data received from storage');
        }

        audioData = data;
        downloadError = null;
        console.log('[process-recording] Audio file downloaded successfully:', {
          attempt,
          size: data.size,
          type: data.type
        });
        break;
      } catch (error) {
        console.error(`[process-recording] Download attempt ${attempt} exception:`, error);
        downloadError = error instanceof Error ? error : new Error(String(error));
        if (attempt < 3) {
          const delay = 1000 * attempt;
          console.log(`[process-recording] Waiting ${delay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!audioData) {
      const errorMessage = downloadError?.message || 'Unknown error';
      console.error('[process-recording] All download attempts failed:', errorMessage);
      throw new Error(`Failed to download audio after all attempts: ${errorMessage}`);
    }

    // Create FormData for OpenAI
    console.log('[process-recording] Preparing audio for OpenAI...');
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    console.log('[process-recording] Sending audio to OpenAI...');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.json();
      console.error('[process-recording] OpenAI API error:', errorData);
      throw new Error(`Transcription failed: ${errorData.error?.message || transcriptionResponse.statusText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    
    if (!transcriptionResult.text) {
      console.error('[process-recording] No transcription text in response:', transcriptionResult);
      throw new Error('No transcription text received from OpenAI');
    }

    console.log('[process-recording] Transcription received');

    // Process with GPT
    console.log('[process-recording] Processing with GPT...');
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      console.error('[process-recording] GPT API error:', errorData);
      throw new Error(`GPT processing failed: ${errorData.error?.message}`);
    }

    const gptResult = await gptResponse.json();
    const processedContent = gptResult.choices[0].message.content;

    // Update recording with results
    console.log('[process-recording] Updating recording with results...');
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        transcription: transcriptionResult.text,
        processed_content: processedContent,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('[process-recording] Error updating recording:', updateError);
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    // Create note
    console.log('[process-recording] Creating note...');
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: recording.user_id,
        recording_id: recordingId,
        title: recording.title || `Note from ${new Date().toLocaleString()}`,
        original_transcript: transcriptionResult.text,
        processed_content: processedContent,
        audio_url: recording.file_path,
        duration: recording.duration
      });

    if (noteError) {
      console.error('[process-recording] Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    console.log('[process-recording] Processing completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recording processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-recording] Error:', error);
    
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
        console.error('[process-recording] Failed to update recording status:', updateError);
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
