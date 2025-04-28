
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// URL do serviço Fast Whisper - pode ser um serviço local ou remoto
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

    console.log('Processando dados de áudio:', {
      informacoesGravacao: recordingData ? 'Presentes' : 'Ausentes',
      tamanhoDadosAudio: audioData.length,
      tipo: typeof audioData
    });

    // Converter base64 para Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: recordingData?.mimeType || 'audio/webm' });

    // Gerar um nome de arquivo único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = 'webm';
    const fileName = `whisper-transcriptions/${timestamp}-recording.${fileExtension}`;
    
    // Fazer upload do arquivo para o storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio-recordings')
      .upload(fileName, blob, {
        contentType: recordingData?.mimeType || 'audio/webm',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Erro ao fazer upload do áudio: ${uploadError.message}`);
    }
    
    console.log('Áudio enviado com sucesso:', uploadData);
    
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
        content: 'Processando...', // Será atualizado pelo serviço fast-whisper
        duration_ms: recordingData?.duration || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (transcriptionError) {
      throw new Error(`Erro ao criar registro de transcrição: ${transcriptionError.message}`);
    }
    
    console.log('Registro de transcrição criado:', transcriptionData.id);
    
    // Enviar requisição para o serviço fast-whisper via modo simulado
    // Na versão de produção, este seria um serviço real
    let responseData;
    
    try {
      console.log('Usando modo simulado de transcrição para o Lovable');
      
      // Atualizar a transcrição com texto simulado após 2 segundos
      setTimeout(async () => {
        try {
          await supabase
            .from('transcriptions')
            .update({
              content: "Esta é uma transcrição simulada para teste no Lovable. Em um ambiente real, o serviço Python fast-whisper processaria o áudio.",
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', transcriptionData.id);
          
          console.log('Transcrição simulada concluída com sucesso');
        } catch (error) {
          console.error('Erro na simulação de transcrição:', error);
        }
      }, 2000);
      
      responseData = {
        success: true,
        message: "Simulação de transcrição iniciada"
      };
    } catch (fastWhisperError) {
      console.error('Erro ao chamar simulação de transcrição:', fastWhisperError);
      // Não falhar a resposta, apenas registrar o erro e atualizar o status da transcrição
      await supabase
        .from('transcriptions')
        .update({
          status: 'error',
          error_message: "Erro na simulação de transcrição"
        })
        .eq('id', transcriptionData.id);
        
      responseData = {
        success: false,
        error: "Erro na simulação de transcrição"
      };
    }

    // Informar ao cliente que a transcrição foi iniciada com sucesso
    return new Response(
      JSON.stringify({
        success: true,
        transcriptionId: transcriptionData.id,
        message: "Processo de transcrição iniciado. Verifique o status usando o ID da transcrição.",
        transcription: "Processando seu áudio com fast-whisper. Por favor, aguarde...",
        simulationMode: true
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ocorreu'
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
