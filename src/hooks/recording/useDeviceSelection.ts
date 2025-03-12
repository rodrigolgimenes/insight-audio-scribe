
import { useState, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { getAudioDevices, audioDevices, defaultDeviceId } = useAudioCapture();

  useEffect(() => {
    const initDevices = async () => {
      console.log('[useDeviceSelection] Initializing audio devices');
      await getAudioDevices();
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
