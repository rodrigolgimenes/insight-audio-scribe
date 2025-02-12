
import { useToast } from "@/hooks/use-toast";
import { MIC_CONSTRAINTS } from "./audioConfig";
import { useSystemAudio } from "./useSystemAudio";
import { handleAudioError } from "./audioErrorHandler";

export const useAudioCapture = () => {
  const { toast } = useToast();
  const { captureSystemAudio } = useSystemAudio();

  const requestMicrophoneAccess = async (isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta captura de áudio');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('[useAudioCapture] Available audio devices:', audioInputs);

      if (audioInputs.length === 0) {
        throw new Error('Nenhum dispositivo de áudio encontrado');
      }

      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      } catch (micError) {
        console.warn('[useAudioCapture] Failed with advanced constraints, trying basic config:', micError);
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      if (isSystemAudio) {
        micStream = await captureSystemAudio(micStream);
      }

      console.log('[useAudioCapture] Final audio stream details:', {
        id: micStream.id,
        active: micStream.active,
        trackCount: micStream.getAudioTracks().length,
        tracks: micStream.getAudioTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        }))
      });

      return micStream;
    } catch (error) {
      console.error('[useAudioCapture] Error accessing audio:', error);
      
      toast({
        title: "Erro de Captura",
        description: handleAudioError(error, isSystemAudio),
        variant: "destructive",
      });
      
      return null;
    }
  };

  return {
    requestMicrophoneAccess,
  };
};
