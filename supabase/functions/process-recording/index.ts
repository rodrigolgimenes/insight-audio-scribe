
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000; // 2 segundos

async function waitForFileAvailability(
  supabase: ReturnType<typeof createClient>,
  path: string,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_RETRY_DELAY
): Promise<void> {
  console.log('[process-recording] Waiting for file availability:', path);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[process-recording] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const { data: fileExists, error } = await supabase.storage
        .from('audio_recordings')
        .list(path.split('/')[0], {
          limit: 1,
          search: path.split('/')[1]
        });

      if (error) {
        console.error(`[process-recording] Error checking file (attempt ${attempt + 1}):`, error);
        continue;
      }

      if (fileExists && fileExists.length > 0) {
        console.log('[process-recording] File found after waiting:', fileExists[0]);
        return;
      }

      console.log(`[process-recording] File not found yet (attempt ${attempt + 1})`);
    } catch (error) {
      console.error(`[process-recording] Error in attempt ${attempt + 1}:`, error);
    }
  }

  throw new Error(`File not available after ${maxRetries} attempts: ${path}`);
}

async function downloadWithRetry(
  url: string,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_RETRY_DELAY
): Promise<Blob> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      console.log('[process-recording] Download successful:', {
        size: blob.size,
        type: blob.type,
        attempt: attempt + 1
      });

      return blob;
    } catch (error) {
      console.error(`[process-recording] Download attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[process-recording] Waiting ${delay}ms before next attempt`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('All download attempts failed');
}

async function downloadLargeFile(supabase: ReturnType<typeof createClient>, path: string): Promise<Blob> {
  try {
    console.log('[process-recording] Starting download process for:', path);

    // Primeiro, espera o arquivo estar disponível
    await waitForFileAvailability(supabase, path);

    // Tenta obter o arquivo usando download direto primeiro
    try {
      console.log('[process-recording] Attempting direct download');
      const { data, error } = await supabase.storage
        .from('audio_recordings')
        .download(path);

      if (!error && data) {
        console.log('[process-recording] Direct download successful');
        return data;
      }
    } catch (error) {
      console.warn('[process-recording] Direct download failed, falling back to signed URL:', error);
    }

    // Fallback para URL assinada
    console.log('[process-recording] Getting signed URL');
    const { data: urlData, error: urlError } = await supabase.storage
      .from('audio_recordings')
      .createSignedUrl(path, 3600);

    if (urlError || !urlData?.signedUrl) {
      throw new Error('Failed to get signed URL');
    }

    // Download com retry
    return await downloadWithRetry(urlData.signedUrl);
  } catch (error) {
    console.error('[process-recording] Error in downloadLargeFile:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

async function processAudioChunk(chunk: Blob, openAIApiKey: string): Promise<string> {
  const retryCount = 3;
  let lastError;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      console.log(`[process-recording] Processing chunk attempt ${attempt + 1}, size: ${chunk.size} bytes`);
      
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
      console.log('[process-recording] Chunk processed successfully');
      return transcriptionResult.text || '';
    } catch (error) {
      console.error(`[process-recording] Chunk processing attempt ${attempt + 1} failed:`, error);
      lastError = error;
      if (attempt < retryCount - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`[process-recording] Waiting ${delay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
    
    console.log('[process-recording] Starting processing for recording:', recordingId);
    
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

    console.log('[process-recording] Recording found:', {
      id: recording.id,
      file_path: recording.file_path,
      duration: recording.duration
    });

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
      console.log(`[process-recording] Processing chunk ${i + 1}/${chunks.length}, size: ${chunks[i].size} bytes`);
      const transcription = await processAudioChunk(chunks[i], openAIApiKey);
      transcriptions.push(transcription);
    }

    const fullTranscript = transcriptions.join(' ');
    console.log('[process-recording] Full transcript generated, length:', fullTranscript.length);

    // Process with GPT-3.5-turbo
    console.log('[process-recording] Starting GPT processing');
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

    console.log('[process-recording] GPT processing completed');

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
