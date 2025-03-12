
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceInfo['kind'];
  isDefault?: boolean;
}

export const useDeviceManagement = () => {
  const { toast } = useToast();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);

  const getAudioDevices = async (): Promise<AudioDevice[]> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
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

      if (audioInputs.length > 0) {
        const firstDeviceId = audioInputs[0].deviceId;
        setDefaultDeviceId(firstDeviceId);
        console.log('[useDeviceManagement] First device selected as default:', audioInputs[0].label);
      }
      
      setAudioDevices(audioInputs);
      console.log('[useDeviceManagement] Available audio devices:', audioInputs);
      
      return audioInputs;
    } catch (error) {
      console.error('[useDeviceManagement] Error getting audio devices:', error);
      toast({
        title: "Error",
        description: "Could not list audio devices",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    getAudioDevices,
    audioDevices,
    defaultDeviceId,
  };
};
