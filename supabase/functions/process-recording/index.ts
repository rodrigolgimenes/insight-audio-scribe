
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

async function downloadLargeFile(supabase: ReturnType<typeof createClient>, path: string): Promise<Blob> {
  try {
    console.log('[process-recording] Getting file info...', { path });
    const { data: fileData, error: urlError } = await supabase.storage
      .from('audio_recordings')
      .createSignedUrl(path, 3600); // 1 hour expiration

    if (urlError) {
      console.error('[process-recording] Error getting signed URL:', urlError);
      throw new Error(`Failed to get signed URL: ${urlError.message}`);
    }

    if (!fileData?.signedUrl) {
      throw new Error('No signed URL generated');
    }

    console.log('[process-recording] Downloading file...', { signedUrl: fileData.signedUrl });
    const response = await fetch(fileData.signedUrl);
    
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
    console.error('[process-recording] Error in downloadLargeFile:', error);
    throw error;
  }
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

    // Download the audio file using chunked download
    console.log('[process-recording] Starting chunked download of audio file...');
    const audioBlob = await downloadLargeFile(supabase, recording.file_path);
    
    console.log('[process-recording] Audio file downloaded successfully:', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    // Split audio if it's too large
    let audioChunks: Blob[] = [];
    if (audioBlob.size > MAX_CHUNK_SIZE) {
      console.log('[process-recording] Splitting large audio file into chunks...');
      const totalChunks = Math.ceil(audioBlob.size / MAX_CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min(start + MAX_CHUNK_SIZE, audioBlob.size);
        audioChunks.push(audioBlob.slice(start, end, audioBlob.type));
      }
    } else {
      audioChunks = [audioBlob];
    }

    let fullTranscript = '';
    
    // Process each chunk
    for (let i = 0; i < audioChunks.length; i++) {
      console.log(`[process-recording] Processing chunk ${i + 1}/${audioChunks.length}`);
      
      const formData = new FormData();
      formData.append('file', audioChunks[i], 'audio.webm');
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
        console.error('[process-recording] OpenAI API error:', errorData);
        throw new Error(`Transcription failed: ${errorData.error?.message || transcriptionResponse.statusText}`);
      }

      const transcriptionResult = await transcriptionResponse.json();
      fullTranscript += (i > 0 ? ' ' : '') + (transcriptionResult.text || '');
    }

    if (!fullTranscript) {
      throw new Error('No transcription text received from OpenAI');
    }

    console.log('[process-recording] Full transcription completed');

    // Process with GPT
    console.log('[process-recording] Processing with GPT...');
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
        transcription: fullTranscript,
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
        original_transcript: fullTranscript,
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
