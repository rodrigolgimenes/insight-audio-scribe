
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recordingId } = await req.json();

    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    console.log('[process-recording] Processing recording:', recordingId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recording information
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      console.error('[process-recording] Error fetching recording:', recordingError);
      throw new Error('Recording not found');
    }

    console.log('[process-recording] Recording data:', recording);
    console.log('[process-recording] Audio duration:', recording.duration, 'ms');

    // Check file size before processing
    const { data: fileData, error: fileError } = await supabase.storage
      .from('audio_recordings')
      .list(recording.file_path.split('/')[0], {
        search: recording.file_path.split('/')[1]
      });

    if (fileError) {
      console.error('[process-recording] Error checking file size:', fileError);
    } else if (fileData && fileData.length > 0) {
      const fileSize = fileData[0].metadata?.size || 0;
      console.log('[process-recording] File size:', fileSize, 'bytes');
    }
    
    // Check if file is too large for direct transcription (OpenAI has a 25MB limit)
    // For OpenAI, we'll consider anything over 25 minutes as large for now
    const isLargeFile = recording.duration && recording.duration > 25 * 60 * 1000; // More than 25 minutes
    console.log('[process-recording] Is large file:', isLargeFile);
    
    // For files that are extremely large (over 60 minutes), we'll update the logic
    const isExtremelyLargeFile = recording.duration && recording.duration > 60 * 60 * 1000; // More than 60 minutes
    
    if (isExtremelyLargeFile) {
      console.log('[process-recording] This file is extremely large and may take longer to process');
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from('recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    if (updateError) {
      console.error('[process-recording] Error updating status:', updateError);
      throw new Error('Failed to update recording status');
    }

    // Create or get existing note using ON CONFLICT DO NOTHING
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .upsert({
        title: recording.title,
        recording_id: recordingId,
        user_id: recording.user_id,
        duration: recording.duration,
        processed_content: '', 
        status: 'processing',
        processing_progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'recording_id',
        ignoreDuplicates: true
      })
      .select()
      .single();

    if (noteError) {
      console.error('[process-recording] Error creating/getting note:', noteError);
      throw new Error('Failed to create/get note');
    }

    if (!note) {
      throw new Error('Could not create or retrieve note');
    }

    console.log('[process-recording] Note:', note);

    // For larger files, use a different strategy
    const functionToInvoke = isLargeFile ? 
      'process-large-recording' : // A function we would create for handling large files
      'transcribe-audio';

    // Start transcription in background
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log(`[process-recording] Starting transcription process with '${functionToInvoke}'`);
        
        // Update note status to transcribing
        await supabase
          .from('notes')
          .update({ 
            status: 'transcribing',
            processing_progress: 10 
          })
          .eq('id', note.id);
        
        // Give Storage time to process the file
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const { error: transcribeError } = await supabase.functions
          .invoke(functionToInvoke, {
            body: { 
              noteId: note.id,
              recordingId: recordingId,
              duration: recording.duration,
              isLargeFile,
              isExtremelyLargeFile
            }
          });

        if (transcribeError) {
          console.error('[process-recording] Transcription error:', transcribeError);
          throw transcribeError;
        }

        console.log('[process-recording] Transcription started successfully');
      } catch (error) {
        console.error('[process-recording] Background task error:', error);
        
        // Update note and recording status to error
        await Promise.all([
          supabase
            .from('recordings')
            .update({ 
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error during processing'
            })
            .eq('id', recordingId),
          supabase
            .from('notes')
            .update({ 
              status: 'error',
              processing_progress: 0,
              error_message: error instanceof Error ? error.message : 'Unknown error during processing'
            })
            .eq('id', note.id)
        ]);
      }
    })());

    return new Response(
      JSON.stringify({ success: true, noteId: note.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-recording] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 200, // Keep 200 to avoid CORS error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
