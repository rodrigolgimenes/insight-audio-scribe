
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FASTWHISPER_API_URL = Deno.env.get('FASTWHISPER_API_URL') || 'http://localhost:8000/transcribe';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, recordingData } = await req.json();
    
    if (!audioData) {
      throw new Error('Audio data is missing from the request');
    }

    console.log('Processing audio data:', {
      recordingInfo: recordingData ? 'Present' : 'Missing',
      audioDataLength: audioData.length,
      type: typeof audioData
    });

    // Converter base64 para Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: recordingData?.mimeType || 'audio/webm' });

    // Gerar um nome de arquivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = 'webm';
    const fileName = `whisper-transcriptions/${timestamp}-recording.${fileExtension}`;
    
    // Fazer upload do arquivo para storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio-recordings')
      .upload(fileName, blob, {
        contentType: recordingData?.mimeType || 'audio/webm',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Error uploading audio: ${uploadError.message}`);
    }
    
    console.log('Audio uploaded successfully:', uploadData);
    
    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('audio-recordings')
      .getPublicUrl(fileName);
    
    // Criar entrada na tabela de transcrições
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        audio_url: publicUrl,
        content: 'Processing...', // Será atualizado pelo serviço fast-whisper
        duration_ms: recordingData?.duration || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (transcriptionError) {
      throw new Error(`Error creating transcription record: ${transcriptionError.message}`);
    }
    
    console.log('Transcription record created:', transcriptionData.id);
    
    // Enviar requisição para o serviço fast-whisper externo
    // Na implementação real, esse serviço precisa estar disponível online
    try {
      // Esta é uma simulação da requisição para o serviço fast-whisper
      // Em produção, você enviaria para um serviço real
      console.log(`Would send request to fast-whisper service at ${FASTWHISPER_API_URL}`);
      console.log(`With transcription ID: ${transcriptionData.id}`);
      console.log(`And audio URL: ${publicUrl}`);
      
      // Simular o processamento do fast-whisper
      // Em produção, isso seria feito de forma assíncrona pelo serviço Python
      setTimeout(async () => {
        try {
          const mockTranscription = "Esta é uma transcrição simulada do serviço fast-whisper. " +
            "Em um ambiente de produção, o texto seria resultado do processamento real do áudio com a biblioteca fast-whisper.";
          
          const { error: updateError } = await supabase
            .from('transcriptions')
            .update({
              content: mockTranscription,
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', transcriptionData.id);
          
          if (updateError) {
            console.error('Error updating transcription:', updateError);
          } else {
            console.log('Transcription updated successfully');
          }
        } catch (error) {
          console.error('Error in async fast-whisper simulation:', error);
        }
      }, 5000);
      
    } catch (fastWhisperError) {
      console.error('Error calling fast-whisper service:', fastWhisperError);
      // Não falhar a resposta, apenas registrar o erro e atualizar o status da transcrição
      await supabase
        .from('transcriptions')
        .update({
          status: 'error',
          error_message: fastWhisperError.message
        })
        .eq('id', transcriptionData.id);
    }

    // Informar cliente que a transcrição foi iniciada com sucesso
    return new Response(
      JSON.stringify({
        success: true,
        transcriptionId: transcriptionData.id,
        message: "Transcription process initiated. Check status using the transcription ID.",
        transcription: "Processing your audio with fast-whisper. Please wait..."
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
