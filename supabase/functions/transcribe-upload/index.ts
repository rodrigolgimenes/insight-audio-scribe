
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { transcribeAudio, processWithGPT } from './openAI.ts';
import { 
  uploadToStorage, 
  updateRecordingWithTranscription
} from './supabaseOperations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let formData;
  let recordingId;
  
  try {
    console.log('Starting file processing...');
    formData = await req.formData();
    const file = formData.get('file');
    recordingId = formData.get('recordingId');
    const duration = formData.get('duration');

    if (!file || !recordingId) {
      console.error('Missing required parameters:', { file: !!file, recordingId: !!recordingId });
      throw new Error('No file uploaded or missing recordingId');
    }

    console.log('Request parameters:', {
      fileType: file instanceof File ? file.type : 'unknown',
      fileSize: file instanceof File ? file.size : 'unknown',
      recordingId,
      duration
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update recording status to processing
    const { error: statusError } = await supabase
      .from('recordings')
      .update({ 
        status: 'processing',
        duration: duration ? parseInt(duration.toString()) : null 
      })
      .eq('id', recordingId);

    if (statusError) {
      console.error('Error updating recording status:', statusError);
      throw new Error(`Failed to update recording status: ${statusError.message}`);
    }

    // Verificar se o arquivo é MP3, caso contrário, forçar o tipo correto
    let fileToUpload = file as File;
    let fileType = fileToUpload.type;
    
    // IMPORTANTE: Garantir que o arquivo tenha o tipo correto, independentemente do formato original
    if (fileType !== 'audio/mp3' && fileType !== 'audio/mpeg' || 
        !fileToUpload.name.toLowerCase().endsWith('.mp3')) {
      console.log(`File type is ${fileType}, enforcing audio/mp3 for processing`);
      
      // Se o nome do arquivo não termina em .mp3, modificar o nome
      let newFilename = fileToUpload.name;
      if (!newFilename.toLowerCase().endsWith('.mp3')) {
        newFilename = newFilename.replace(/\.[^/.]+$/, '') + '.mp3';
      }
      
      // Criar um novo File com o tipo de conteúdo correto
      const arrayBuffer = await fileToUpload.arrayBuffer();
      fileToUpload = new File(
        [arrayBuffer], 
        newFilename,
        { type: 'audio/mp3' }
      );
      
      console.log('File type enforced to MP3:', fileToUpload.name, fileToUpload.type);
    }
    
    // Upload the audio file directly - SEMPRE com extensão .mp3
    const filePath = `${recordingId}/${crypto.randomUUID()}.mp3`;
    const fileBlob = new Blob([await fileToUpload.arrayBuffer()], { type: 'audio/mp3' });
    
    console.log('Uploading audio file...', {
      filePath,
      size: fileBlob.size,
      type: fileBlob.type
    });

    const { data: { publicUrl }, error: uploadError } = await uploadToStorage(supabase, filePath, fileBlob);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', { publicUrl });

    // Update recording with file path
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

    // Create note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        recording_id: recordingId,
        title: 'New Recording',
        status: 'processing',
        processing_progress: 0
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    // Start transcription process
    const { error: transcribeError } = await supabase.functions
      .invoke('transcribe-audio', {
        body: { 
          noteId: note.id,
          recordingId 
        }
      });

    if (transcribeError) {
      throw new Error(`Failed to start transcription: ${transcribeError.message}`);
    }

    console.log('Transcription process started successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Recording uploaded and transcription started',
        noteId: note.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-upload function:', error);
    
    try {
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
        status: 200, // Changed from 500 to 200 to avoid CORS issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
