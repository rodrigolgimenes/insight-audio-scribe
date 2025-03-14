
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { FFmpeg } from 'https://esm.sh/@ffmpeg/ffmpeg@0.12.9';
import { splitAudioIntoChunks } from '../transcribe-upload/audioProcessing.ts';

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

    // Download the audio file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio_recordings')
      .download(recording.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'File not found'}`);
    }

    console.log(`File downloaded, size: ${fileData.size} bytes (${Math.round(fileData.size/1024/1024*100)/100} MB)`);

    // Update progress
    await supabase
      .from('notes')
      .update({ 
        processing_progress: 20,
        status: 'processing' 
      })
      .eq('id', noteId);

    // Se o arquivo for maior que ~20MB, vamos sempre usar o processamento em chunks
    // para evitar problemas com a API da OpenAI
    const shouldUseChunking = fileData.size > 20 * 1024 * 1024;
    console.log(`Should use chunking based on file size: ${shouldUseChunking ? 'Yes' : 'No'}`);
    
    // Para arquivos grandes ou extremamente grandes, sempre usamos chunking
    if (shouldUseChunking || isExtremelyLargeFile) {
      console.log('Processing large file with chunking');
      
      // Initialize FFmpeg
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      
      // Convert the blob to Uint8Array
      const arrayBuffer = await fileData.arrayBuffer();
      const fileUint8Array = new Uint8Array(arrayBuffer);
      
      // Get the file extension
      const fileExtension = recording.file_path.split('.').pop() || 'mp3';
      const inputFileName = `input.${fileExtension}`;
      
      console.log(`Starting to split large file into chunks...`);
      
      // Tamanho de chunk baseado no tamanho do arquivo
      // Para arquivos extremamente grandes, usamos chunks menores
      const chunkDurationSeconds = isExtremelyLargeFile ? 10 * 60 : 15 * 60; // 10 ou 15 minutos
      console.log(`Using chunk duration of ${chunkDurationSeconds} seconds`);
      
      // Split into chunks
      const chunks = await splitAudioIntoChunks(
        ffmpeg, 
        fileUint8Array, 
        inputFileName,
        chunkDurationSeconds
      );
      
      console.log(`File split into ${chunks.length} chunks`);
      
      // Update note with total chunks
      await supabase
        .from('notes')
        .update({ 
          total_chunks: chunks.length,
          processing_progress: 30,
          status: 'processing' 
        })
        .eq('id', noteId);
      
      // Process each chunk with transcribe-audio function
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
        
        // Create a file from the chunk
        const chunkBlob = new Blob([chunks[i]], { type: 'audio/mp3' });
        const chunkPath = `${recordingId}/chunk_${i + 1}.mp3`;
        
        // Upload the chunk
        const { error: uploadError } = await supabase.storage
          .from('audio_recordings')
          .upload(chunkPath, chunkBlob, {
            contentType: 'audio/mp3',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`Error uploading chunk ${i + 1}:`, uploadError);
          continue; // Try the next chunk
        }
        
        // Call transcribe-audio function with chunk information
        const { error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
          body: {
            noteId,
            recordingId,
            chunkInfo: {
              index: i,
              total: chunks.length,
              path: chunkPath
            },
            isChunkedTranscription: true,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        });
        
        if (transcribeError) {
          console.error(`Error transcribing chunk ${i + 1}:`, transcribeError);
        }
        
        // Update progress based on chunks processed
        const progress = Math.min(30 + Math.floor((i + 1) / chunks.length * 60), 90);
        await supabase
          .from('notes')
          .update({ 
            processing_progress: progress,
            status: 'processing',
            current_chunk: i + 1
          })
          .eq('id', noteId);
      }
    } else {
      // Para arquivos menores, usamos transcrição direta
      console.log('Processing file with direct transcription');
      
      const { error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          noteId,
          recordingId,
          isLargeFile: true
        }
      });
      
      if (transcribeError) {
        throw new Error(`Failed to start transcription: ${transcribeError.message}`);
      }
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
