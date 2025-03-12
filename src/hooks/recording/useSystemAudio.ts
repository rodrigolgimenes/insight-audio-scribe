
import { useCallback } from "react";

export const useSystemAudio = (setIsSystemAudio: (value: boolean) => void) => {
  const handleSystemAudioChange = useCallback((enabled: boolean) => {
    console.log('[useSystemAudio] Setting system audio to:', enabled);
    setIsSystemAudio(enabled);
  }, [setIsSystemAudio]);

  return {
    handleSystemAudioChange
  };
};
