
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useAudioCapture = () => {
  const { toast } = useToast();

  const requestMicrophoneAccess = async (isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      let stream: MediaStream;
      
      if (isSystemAudio) {
        console.log('[useAudioCapture] Requesting system audio');
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
            sampleRate: 48000
          },
          video: false 
        });
      } else {
        console.log('[useAudioCapture] Requesting microphone access');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
            sampleRate: 48000
          },
          video: false
        });
      }

      console.log('[useAudioCapture] Checking audio tracks...');
      const audioTracks = stream.getAudioTracks();
      
      if (!audioTracks || audioTracks.length === 0) {
        throw new Error('Nenhuma fonte de áudio detectada');
      }

      console.log('[useAudioCapture] Audio stream details:', {
        id: stream.id,
        active: stream.active,
        trackCount: audioTracks.length,
        tracks: audioTracks.map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        }))
      });

      // Verificar se o stream está ativo
      if (!stream.active) {
        throw new Error('O stream de áudio não está ativo');
      }

      // Adicionar listeners para monitorar o estado do stream
      audioTracks.forEach(track => {
        track.onended = () => {
          console.log('[useAudioCapture] Audio track ended:', track.label);
          toast({
            title: "Aviso",
            description: "A captura de áudio foi interrompida.",
            variant: "default",
          });
        };

        track.onmute = () => {
          console.log('[useAudioCapture] Audio track muted:', track.label);
        };

        track.onunmute = () => {
          console.log('[useAudioCapture] Audio track unmuted:', track.label);
        };
      });

      return stream;
    } catch (error) {
      console.error('[useAudioCapture] Error accessing audio:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro de Captura",
        description: isSystemAudio 
          ? `Não foi possível capturar o áudio do sistema: ${errorMessage}`
          : `Não foi possível acessar o microfone: ${errorMessage}`,
        variant: "destructive",
      });
      
      return null;
    }
  };

  return {
    requestMicrophoneAccess,
  };
};
