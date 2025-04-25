
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// URL do serviço VPS de transcrição
const TRANSCRIPTION_API_URL = 'http://167.88.42.2:8001/api/transcribe';

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
        content: 'Processando...', // Será atualizado pelo serviço VPS
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
    
    // Preparar o formulário para envio ao serviço VPS
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    
    let transcriptionResult;
    try {
      console.log('Enviando áudio para API de transcrição VPS...');
      
      const vpsResponse = await fetch(TRANSCRIPTION_API_URL, {
        method: 'POST',
        body: formData,
      });
      
      if (!vpsResponse.ok) {
        throw new Error(`Erro na API de transcrição: ${vpsResponse.status} ${vpsResponse.statusText}`);
      }
      
      transcriptionResult = await vpsResponse.json();
      console.log('Resposta da API de transcrição:', transcriptionResult);
      
      // Atualizar a transcrição com o texto recebido
      await supabase
        .from('transcriptions')
        .update({
          content: transcriptionResult.text || "Transcrição não retornou texto",
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', transcriptionData.id);
        
      console.log('Transcrição concluída com sucesso');
    } catch (vpsError) {
      console.error('Erro ao chamar API de transcrição:', vpsError);
      
      // Simular transcrição para testes em caso de falha na API
      setTimeout(async () => {
        try {
          await supabase
            .from('transcriptions')
            .update({
              content: "Esta é uma transcrição de fallback. A API de transcrição VPS não pôde ser contatada ou retornou um erro.",
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', transcriptionData.id);
          
          console.log('Transcrição de fallback concluída');
        } catch (error) {
          console.error('Erro na simulação de transcrição:', error);
        }
      }, 2000);
      
      // Atualizar status para erro
      await supabase
        .from('transcriptions')
        .update({
          status: 'error',
          error_message: `Erro na API de transcrição: ${vpsError.message}`
        })
        .eq('id', transcriptionData.id);
        
      transcriptionResult = {
        success: false,
        error: vpsError.message
      };
    }

    // Informar ao cliente que a transcrição foi iniciada/processada
    return new Response(
      JSON.stringify({
        success: true,
        transcriptionId: transcriptionData.id,
        message: "Processo de transcrição concluído.",
        transcription: transcriptionResult?.text || "Processando seu áudio. Por favor, aguarde...",
        error: transcriptionResult?.error
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
