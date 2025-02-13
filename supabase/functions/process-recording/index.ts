
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const URL_EXPIRATION = 12 * 3600; // 12 hours in seconds

async function downloadLargeFile(supabase: ReturnType<typeof createClient>, path: string): Promise<Blob> {
  try {
    console.log('[process-recording] Getting file info...', { path });
    const { data: fileData, error: urlError } = await supabase.storage
      .from('audio_recordings')
      .createSignedUrl(path, URL_EXPIRATION);

    if (urlError) {
      console.error('[process-recording] Error getting signed URL:', urlError);
      throw new Error(`Failed to get signed URL: ${urlError.message}`);
    }

    if (!fileData?.signedUrl) {
      throw new Error('No signed URL generated');
    }

    console.log('[process-recording] Downloading file...', { signedUrl: fileData.signedUrl });
    
    // Add timeout and retry mechanism for large files
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 1 minute timeout
    
    try {
      const response = await fetch(fileData.signedUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.error('[process-recording] Download failed:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('[process-recording] File downloaded successfully:', {
        size: blob.size,
        type: blob.type
      });
      
      return blob;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Download timeout - file may be too large');
      }
      throw error;
    }
  } catch (error) {
    console.error('[process-recording] Error in downloadLargeFile:', error);
    throw error;
  }
}

async function processAudioChunk(chunk: Blob, openAIApiKey: string): Promise<string> {
  const retryCount = 3;
  let lastError;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', chunk, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json();
        throw new Error(`Transcription failed: ${errorData.error?.message || transcriptionResponse.statusText}`);
      }

      const transcriptionResult = await transcriptionResponse.json();
      return transcriptionResult.text || '';
    } catch (error) {
      console.error(`[process-recording] Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

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
      .maybeSingle();

    if (recordingError) {
      console.error('[process-recording] Error fetching recording:', recordingError);
      throw new Error(`Recording fetch failed: ${recordingError.message}`);
    }

    if (!recording) {
      throw new Error('Recording not found');
    }

    // Update recording status to processing
    await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    const audioBlob = await downloadLargeFile(supabase, recording.file_path);

    // Split audio into smaller chunks
    const chunks: Blob[] = [];
    let offset = 0;
    while (offset < audioBlob.size) {
      const chunk = audioBlob.slice(offset, offset + MAX_CHUNK_SIZE);
      chunks.push(chunk);
      offset += MAX_CHUNK_SIZE;
    }

    console.log(`[process-recording] Split audio into ${chunks.length} chunks`);

    // Process chunks with retries and collect transcriptions
    const transcriptions: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[process-recording] Processing chunk ${i + 1}/${chunks.length}`);
      const transcription = await processAudioChunk(chunks[i], openAIApiKey);
      transcriptions.push(transcription);
    }

    const fullTranscript = transcriptions.join(' ');

    // Process with GPT-3.5-turbo
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Analyze this transcript and provide:
1. Summary
2. Key Points
3. Action Items
4. Next Steps

Transcript:
${fullTranscript}

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

    // Update recording with results
    await supabase
      .from('recordings')
      .update({
        transcription: fullTranscript,
        processed_content: processedContent,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', recordingId);

    // Create note
    await supabase
      .from('notes')
      .insert({
        user_id: recording.user_id,
        recording_id: recordingId,
        title: recording.title || `Note from ${new Date().toLocaleString()}`,
        original_transcript: fullTranscript,
        processed_content: processedContent,
        audio_url: recording.file_path,
        duration: recording.duration
      });

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
      await supabase
        .from('recordings')
        .update({ 
          status: 'error',
          error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
        .eq('id', recordingId);
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
