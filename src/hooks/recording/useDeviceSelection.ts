
import { useState, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useToast } from "@/hooks/use-toast";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { getAudioDevices, audioDevices, defaultDeviceId } = useAudioCapture();
  const { toast } = useToast();

  useEffect(() => {
    const initDevices = async () => {
      console.log('[useDeviceSelection] Initializing audio devices');
      try {
        await getAudioDevices();
      } catch (error) {
        console.error('[useDeviceSelection] Error initializing devices:', error);
        toast({
          title: "Error",
          description: "Falha ao acessar dispositivos de áudio. Verifique as permissões do navegador.",
          variant: "destructive",
        });
      }
    };
    
    initDevices();
  }, []);

  // This effect sets the selected device to the default device when available
  useEffect(() => {
    if (defaultDeviceId && !selectedDeviceId) {
      console.log('[useDeviceSelection] Setting default device:', defaultDeviceId);
      setSelectedDeviceId(defaultDeviceId);
    }
  }, [defaultDeviceId, selectedDeviceId]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId
  };
};
