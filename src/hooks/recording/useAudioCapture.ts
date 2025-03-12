
import { useState, useEffect, useCallback } from "react";
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
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Define a function to check and request device permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useAudioCapture] Checking microphone permissions');
      
      // Request permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'granted') {
        console.log('[useAudioCapture] Microphone permission already granted');
        setPermissionGranted(true);
        return true;
      }
      
      if (permissionStatus.state === 'prompt') {
        console.log('[useAudioCapture] Permission prompt will be shown');
        // We need to explicitly request the permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // If we got this far, permission was granted
        stream.getTracks().forEach(track => track.stop()); // Clean up
        setPermissionGranted(true);
        console.log('[useAudioCapture] Permission granted after prompt');
        return true;
      }
      
      if (permissionStatus.state === 'denied') {
        console.error('[useAudioCapture] Microphone permission denied');
        toast({
          title: "Error",
          description: "Microphone access denied. Please enable microphone permissions in your browser settings.",
          variant: "destructive",
        });
        setPermissionGranted(false);
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('[useAudioCapture] Error checking permissions:', error);
      toast({
        title: "Error",
        description: "Failed to check microphone permissions.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const getAudioDevices = useCallback(async (): Promise<AudioDevice[]> => {
    try {
      // First check if we have permission
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.warn('[useAudioCapture] Cannot list devices without permission');
        return [];
      }
      
      console.log('[useAudioCapture] Enumerating audio devices');
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => {
          const isDefault = device.deviceId === 'default' || 
                           device.label.toLowerCase().includes('default') || 
                           device.label.toLowerCase().includes('padrão');
          
          return {
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
            kind: device.kind,
            isDefault
          };
        });

      console.log('[useAudioCapture] Found audio devices:', audioInputs);

      if (audioInputs.length === 0) {
        toast({
          title: "Warning",
          description: "No microphones found. Please connect a microphone and try again.",
          variant: "destructive",
        });
        return [];
      }
      
      // Look for default device
      const defaultDevice = audioInputs.find(device => device.isDefault);
      const firstDeviceId = audioInputs[0].deviceId;
      
      if (defaultDevice) {
        console.log('[useAudioCapture] Found default device:', defaultDevice.label);
        setDefaultDeviceId(defaultDevice.deviceId);
      } else {
        console.log('[useAudioCapture] No default device found, using first device:', firstDeviceId);
        setDefaultDeviceId(firstDeviceId);
      }
      
      setAudioDevices(audioInputs);
      
      return audioInputs;
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      toast({
        title: "Error",
        description: "Failed to list audio devices. Check browser permissions.",
        variant: "destructive",
      });
      return [];
    }
  }, [checkPermissions, toast]);

  const requestMicrophoneAccess = useCallback(async (deviceId: string | null, isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio capture');
      }

      // Make sure we have permission first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.error('[useAudioCapture] Cannot access microphone without permission');
        return null;
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
          throw new Error('Failed to access the selected microphone');
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
          throw new Error('Failed to access microphone');
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
            title: "Notice",
            description: "Could not capture system audio. Using microphone only.",
            variant: "default",
          });
        }
      }

      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('Failed to capture audio from the selected device');
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
        title: "Error",
        description: handleAudioError(error, isSystemAudio),
        variant: "destructive",
      });
      
      return null;
    }
  }, [checkPermissions, captureSystemAudio, toast]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log('[useAudioCapture] Media devices changed, updating device list');
      getAudioDevices().catch(error => {
        console.error('[useAudioCapture] Error updating devices on change:', error);
      });
    };

    // Only set listener if we have permission
    if (permissionGranted) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
    
    return undefined;
  }, [permissionGranted, getAudioDevices]);

  return {
    requestMicrophoneAccess,
    getAudioDevices,
    audioDevices,
    defaultDeviceId,
    permissionGranted,
    checkPermissions
  };
};
