
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MIC_CONSTRAINTS } from "./audioConfig";
import { useSystemAudio } from "./useSystemAudio";
import { handleAudioError } from "./audioErrorHandler";

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceInfo['kind'];
  isDefault?: boolean;
}

export const useAudioCapture = () => {
  const { toast } = useToast();
  const { captureSystemAudio } = useSystemAudio();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);

  const getAudioDevices = async (): Promise<AudioDevice[]> => {
    try {
      console.log('[useAudioCapture] Requesting microphone permission for device enumeration');
      
      // Always request permission first to enumerate devices
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('[useAudioCapture] Permission granted, enumerating devices');
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => {
          const isDefault = device.deviceId === 'default' || 
                           device.label.toLowerCase().includes('default') || 
                           device.label.toLowerCase().includes('padrão');
          
          return {
            deviceId: device.deviceId,
            label: device.label || `Microfone ${device.deviceId.slice(0, 5)}...`,
            kind: device.kind,
            isDefault
          };
        });

      console.log('[useAudioCapture] Found audio devices:', audioInputs);

      if (audioInputs.length === 0) {
        throw new Error('Nenhum microfone encontrado');
      }
      
      // Select first device as default if there's no obvious default
      const firstDeviceId = audioInputs[0].deviceId;
      setDefaultDeviceId(firstDeviceId);
      console.log('[useAudioCapture] First device selected as default:', audioInputs[0].label);
      
      setAudioDevices(audioInputs);
      
      return audioInputs;
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      toast({
        title: "Error",
        description: "Não foi possível listar os dispositivos de áudio. Verifique as permissões do seu navegador.",
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
        // Use exact device ID constraint if available
        const audioConstraints: MediaTrackConstraints = {
          ...MIC_CONSTRAINTS.audio as MediaTrackConstraints,
          deviceId: deviceId ? { exact: deviceId } : undefined
        };

        console.log('[useAudioCapture] Using constraints:', JSON.stringify(audioConstraints));
        
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });
        
        // Check if we actually got any tracks
        if (!micStream || micStream.getAudioTracks().length === 0) {
          throw new Error('Não foi possível acessar o microfone selecionado');
        }
        
        console.log('[useAudioCapture] Microphone stream obtained:', {
          tracks: micStream.getAudioTracks().map(track => ({
            label: track.label,
            enabled: track.enabled,
            settings: track.getSettings()
          }))
        });
      } catch (micError) {
        console.warn('[useAudioCapture] Failed with advanced constraints, trying basic config:', micError);
        // Fallback to basic constraints
        micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false 
        });
        
        if (!micStream || micStream.getAudioTracks().length === 0) {
          throw new Error('Não foi possível acessar o microfone');
        }
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
        throw new Error('Não foi possível capturar áudio do dispositivo selecionado');
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
        title: "Erro",
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
    defaultDeviceId,
  };
};
