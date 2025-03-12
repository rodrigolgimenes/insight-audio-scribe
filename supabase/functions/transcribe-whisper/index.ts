
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    
    // Normalmente, aqui chamariamos o serviço fast-whisper para processar o áudio
    // Como isso requer uma integração com um serviço Python, vamos simular por enquanto
    // Em um ambiente real, você enviaria o publicUrl para um serviço fast-whisper
    
    console.log("Em um ambiente de produção, enviaríamos o áudio para um serviço fast-whisper");
    
    // Simular o tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Para fins de demonstração, retornamos um texto simulado mais realista
    // Em produção, este texto viria do processamento real do fast-whisper
    const transcriptionText = "Esta é uma transcrição de exemplo usando fast-whisper. " +
      "Em um ambiente de produção, o texto seria transcrito a partir do áudio enviado. " +
      "O fast-whisper é otimizado para transcrições rápidas e precisas, especialmente para áudios curtos.";
    
    // Armazenar a transcrição no banco de dados (opcional)
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        audio_url: publicUrl,
        content: transcriptionText,
        duration_ms: recordingData?.duration || 0,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (transcriptionError) {
      console.error('Error storing transcription:', transcriptionError);
      // Não falhar o processo se apenas o armazenamento falhar
    } else {
      console.log('Transcription stored successfully:', transcriptionData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcriptionText,
        message: "This is a simulated response. In production, this would use fast-whisper."
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
