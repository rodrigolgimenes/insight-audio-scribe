
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useAudioCapture = () => {
  const { toast } = useToast();

  const requestMicrophoneAccess = async (isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      let stream: MediaStream;
      
      // Primeiro, verifica se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta captura de áudio');
      }

      if (isSystemAudio) {
        console.log('[useAudioCapture] Requesting system audio');
        // Verificar se o navegador suporta getDisplayMedia
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Seu navegador não suporta captura de áudio do sistema');
        }

        stream = await navigator.mediaDevices.getDisplayMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false 
        });
      } else {
        console.log('[useAudioCapture] Requesting microphone access with constraints');
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false
        };

        console.log('[useAudioCapture] Audio constraints:', constraints);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
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

      // Teste rápido para verificar se o stream está funcionando
      const testTrack = audioTracks[0];
      if (!testTrack.enabled || testTrack.muted) {
        console.warn('[useAudioCapture] Audio track may be disabled or muted:', {
          enabled: testTrack.enabled,
          muted: testTrack.muted
        });
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
          toast({
            title: "Aviso",
            description: "O áudio foi silenciado.",
            variant: "default",
          });
        };

        track.onunmute = () => {
          console.log('[useAudioCapture] Audio track unmuted:', track.label);
        };
      });

      return stream;
    } catch (error) {
      console.error('[useAudioCapture] Error accessing audio:', error);
      
      // Tratamento específico para erros de permissão
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Permissão para uso do microfone negada';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'Nenhum microfone encontrado';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'O microfone pode estar sendo usado por outro aplicativo';
        } else {
          errorMessage = error.message;
        }
      }
      
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
