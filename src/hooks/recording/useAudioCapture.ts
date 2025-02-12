
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MIC_CONSTRAINTS } from "./audioConfig";
import { useSystemAudio } from "./useSystemAudio";
import { handleAudioError } from "./audioErrorHandler";

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceInfo['kind'];
}

export const useAudioCapture = () => {
  const { toast } = useToast();
  const { captureSystemAudio } = useSystemAudio();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);

  const getAudioDevices = async (): Promise<AudioDevice[]> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microfone ${device.deviceId.slice(0, 5)}...`,
          kind: device.kind
        }));

      setAudioDevices(audioInputs);
      console.log('[useAudioCapture] Available audio devices:', audioInputs);
      return audioInputs;
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      toast({
        title: "Erro",
        description: "Não foi possível listar os dispositivos de áudio",
        variant: "destructive",
      });
      return [];
    }
  };

  const requestMicrophoneAccess = async (deviceId: string | null, isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta captura de áudio');
      }

      console.log('[useAudioCapture] Requesting microphone access:', {
        deviceId,
        isSystemAudio
      });

      let micStream: MediaStream;
      try {
        // Use existing MIC_CONSTRAINTS from audioConfig
        const audioConstraints: MediaTrackConstraints = {
          ...MIC_CONSTRAINTS.audio as MediaTrackConstraints,
          deviceId: deviceId ? { exact: deviceId } : undefined
        };

        micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });
        
        console.log('[useAudioCapture] Microphone stream obtained:', {
          tracks: micStream.getAudioTracks().map(track => ({
            label: track.label,
            enabled: track.enabled,
            settings: track.getSettings()
          }))
        });
      } catch (micError) {
        console.warn('[useAudioCapture] Failed with advanced constraints, trying basic config:', micError);
        micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false 
        });
      }

      if (isSystemAudio) {
        try {
          console.log('[useAudioCapture] Attempting to capture system audio...');
          const systemStream = await captureSystemAudio(micStream);
          if (systemStream) {
            console.log('[useAudioCapture] System audio captured successfully');
            micStream = systemStream;
          }
        } catch (systemError) {
          console.error('[useAudioCapture] Failed to capture system audio:', systemError);
          toast({
            title: "Aviso",
            description: "Não foi possível capturar o áudio do sistema. Usando apenas o microfone.",
            variant: "default",
          });
        }
      }

      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('Nenhuma fonte de áudio disponível');
      }

      console.log('[useAudioCapture] Final audio stream details:', {
        id: micStream.id,
        active: micStream.active,
        trackCount: audioTracks.length,
        tracks: audioTracks.map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
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
    getAudioDevices,
    audioDevices,
  };
};
