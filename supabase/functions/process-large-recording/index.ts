
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
    console.log('Starting large file processing...');
    const { noteId, recordingId, isExtremelyLargeFile } = await req.json();

    if (!noteId || !recordingId) {
      throw new Error('Missing required parameters: noteId and recordingId');
    }

    console.log(`Processing large recording: ${recordingId}, note: ${noteId}`);
    console.log(`Is extremely large file: ${isExtremelyLargeFile ? 'Yes' : 'No'}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update note status to processing
    await supabase
      .from('notes')
      .update({ 
        status: 'processing',
        processing_progress: 10,
        error_message: null 
      })
      .eq('id', noteId);

    // Get the recording information
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      throw new Error(`Failed to fetch recording: ${recordingError?.message || 'Not found'}`);
    }

    console.log(`Processing file: ${recording.file_path}`);
    
    // Get file size using getPublicUrl and HEAD request
    let fileSize = 0;
    try {
      const { data: fileInfo } = await supabase.storage
        .from('audio_recordings')
        .getPublicUrl(recording.file_path);
        
      if (fileInfo?.publicUrl) {
        const response = await fetch(fileInfo.publicUrl, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          fileSize = parseInt(contentLength, 10);
          console.log(`File size from HEAD request: ${fileSize} bytes (${Math.round(fileSize/1024/1024*100)/100} MB)`);
        }
      }
    } catch (headError) {
      console.error('Error getting file size from HEAD request:', headError);
    }

    // Update progress
    await supabase
      .from('notes')
      .update({ 
        processing_progress: 20,
        status: 'processing' 
      })
      .eq('id', noteId);

    // Define chunk duration based on file size
    // For extremely large files, use smaller chunks
    const chunkDurationMs = isExtremelyLargeFile ? 10 * 60 * 1000 : 15 * 60 * 1000; // 10 or 15 minutes
    console.log(`Using chunk duration of ${chunkDurationMs/1000/60} minutes`);
    
    // Calculate total duration of the audio from the recording
    const totalDurationMs = recording.duration || (isExtremelyLargeFile ? 120 * 60 * 1000 : 60 * 60 * 1000);
    
    // Calculate number of chunks based on audio duration
    const estimatedChunks = Math.ceil(totalDurationMs / chunkDurationMs);
    console.log(`Estimated total chunks: ${estimatedChunks} based on duration ${totalDurationMs}ms`);
    
    // Update note with total chunks
    await supabase
      .from('notes')
      .update({ 
        total_chunks: estimatedChunks,
        processing_progress: 30,
        status: 'processing' 
      })
      .eq('id', noteId);
    
    // Process each chunk with time-based offsets
    for (let i = 0; i < estimatedChunks; i++) {
      console.log(`Processing chunk ${i + 1} of ${estimatedChunks}`);
      
      const startTime = i * chunkDurationMs;
      const endTime = Math.min((i + 1) * chunkDurationMs, totalDurationMs);
      
      // Call transcribe-audio function with time range information
      const { error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          noteId,
          recordingId,
          chunkInfo: {
            index: i,
            total: estimatedChunks,
            startTime,
            endTime,
            durationMs: endTime - startTime
          },
          isChunkedTranscription: true,
          chunkIndex: i,
          totalChunks: estimatedChunks
        }
      });
      
      if (transcribeError) {
        console.error(`Error transcribing chunk ${i + 1}:`, transcribeError);
      }
      
      // Update progress based on chunks processed
      const progress = Math.min(30 + Math.floor((i + 1) / estimatedChunks * 60), 90);
      await supabase
        .from('notes')
        .update({ 
          processing_progress: progress,
          status: 'processing',
          current_chunk: i + 1
        })
        .eq('id', noteId);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Large file processing started',
        noteId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-large-recording function:', error);
    
    // Try to update note and recording status on error
    try {
      const { noteId, recordingId } = await req.json();
      
      if (noteId && recordingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          await Promise.all([
            supabase
              .from('notes')
              .update({ 
                status: 'error',
                processing_progress: 0,
                error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
              })
              .eq('id', noteId),
            
            supabase
              .from('recordings')
              .update({ 
                status: 'error',
                error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
              })
              .eq('id', recordingId)
          ]);
        }
      }
    } catch (updateError) {
      console.error('Failed to update status on error:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        status: 200, // Use 200 to avoid CORS issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
