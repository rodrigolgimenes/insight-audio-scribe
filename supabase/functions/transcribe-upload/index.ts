
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { transcribeAudio, processWithGPT } from './openAI.ts';
import { 
  uploadToStorage, 
  updateRecordingWithTranscription, 
  createNoteFromTranscription 
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
  let userId;
  
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
      .update({ status: 'processing' })
      .eq('id', recordingId);

    if (statusError) {
      console.error('Error updating recording status:', statusError);
      throw new Error(`Failed to update recording status: ${statusError.message}`);
    }

    // Upload the audio file directly
    const filePath = `${recordingId}/${crypto.randomUUID()}.webm`;
    const fileBlob = new Blob([await (file as File).arrayBuffer()], { type: 'audio/webm' });
    
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

    // Get transcription and process with GPT
    console.log('Starting transcription...');
    const transcription = await transcribeAudio(fileBlob, openAIApiKey);
    console.log('Transcription completed:', transcription.text?.substring(0, 100) + '...');

    if (!transcription.text) {
      throw new Error('No transcription text received from OpenAI');
    }

    // Create note and get user ID
    userId = await createNoteFromTranscription(supabase, recordingId as string, transcription.text, '');

    console.log('Processing with GPT...');
    const processedContent = await processWithGPT(transcription.text, openAIApiKey, userId);
    console.log('GPT processing completed');

    // Update recording and note with processed content
    await updateRecordingWithTranscription(supabase, recordingId as string, transcription.text, processedContent);
    
    // Update the note with processed content
    const { error: noteUpdateError } = await supabase
      .from('notes')
      .update({ processed_content: processedContent })
      .eq('recording_id', recordingId);

    if (noteUpdateError) {
      console.error('Error updating note with processed content:', noteUpdateError);
      throw new Error(`Failed to update note with processed content: ${noteUpdateError.message}`);
    }

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
