
import { useState, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { getAudioDevices, audioDevices, defaultDeviceId } = useAudioCapture();

  useEffect(() => {
    const initDevices = async () => {
      await getAudioDevices();
    };
    
    initDevices();
  }, []);

  // This effect sets the selected device to the first device in the list when available
  useEffect(() => {
    if (defaultDeviceId && !selectedDeviceId) {
      console.log('[useDeviceSelection] Setting first device as default:', defaultDeviceId);
      setSelectedDeviceId(defaultDeviceId);
    }
  }, [defaultDeviceId, selectedDeviceId]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId
  };
};
