
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
          audio: true, 
          video: false 
        });
      } else {
        console.log('[useAudioCapture] Requesting microphone access');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1
          },
          video: false
        });
      }

      if (!stream) {
        throw new Error('Não foi possível obter acesso ao microfone');
      }

      const audioTracks = stream.getAudioTracks();
      console.log('[useAudioCapture] Obtained audio stream:', {
        id: stream.id,
        active: stream.active,
        trackCount: audioTracks.length,
        tracks: audioTracks.map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        }))
      });

      return stream;
    } catch (error) {
      console.error('[useAudioCapture] Error accessing microphone:', error);
      toast({
        title: "Erro",
        description: isSystemAudio 
          ? "Não foi possível iniciar a captura do áudio do sistema. Por favor, verifique as permissões."
          : "Não foi possível iniciar a gravação. Por favor, verifique as permissões do microfone.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    requestMicrophoneAccess,
  };
};
