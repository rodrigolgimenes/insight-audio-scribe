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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      let defaultDevice: AudioDevice | undefined;
      
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => {
          const isDefault = device.deviceId === 'default' || 
                           device.label.toLowerCase().includes('default') || 
                           device.label.toLowerCase().includes('padrão');
          
          const deviceInfo = {
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
            kind: device.kind,
            isDefault
          };
          
          if (isDefault && !defaultDevice) {
            defaultDevice = deviceInfo;
          }
          
          return deviceInfo;
        });

      setAudioDevices(audioInputs);
      
      if (!defaultDevice && audioInputs.length > 0) {
        defaultDevice = audioInputs[0];
        defaultDevice.isDefault = true;
      }
      
      if (defaultDevice) {
        setDefaultDeviceId(defaultDevice.deviceId);
        console.log('[useAudioCapture] Default device selected:', defaultDevice.label);
      }
      
      console.log('[useAudioCapture] Available audio devices:', audioInputs);
      return audioInputs;
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      toast({
        title: "Error",
        description: "Could not list audio devices",
        variant: "destructive",
      });
      return [];
    }
  };

  const requestMicrophoneAccess = async (deviceId: string | null, isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio capture');
      }

      console.log('[useAudioCapture] Requesting microphone access:', {
        deviceId,
        isSystemAudio
      });

      let micStream: MediaStream;
      try {
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
            title: "Warning",
            description: "Could not capture system audio. Using microphone only.",
            variant: "default",
          });
        }
      }

      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio source available');
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
        title: "Capture Error",
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
