
import { useCallback } from "react";

export function useStopRecording(
  recorder: React.RefObject<any>,
  state: { 
    setIsRecording: (value: boolean) => void; 
    setIsPaused: (value: boolean) => void;
  }
) {
  const handleStopRecording = useCallback(async () => {
    console.log('[useStopRecording] Stopping recording');
    
    if (!recorder.current) {
      throw new Error('Recorder not initialized');
    }

    try {
      const result = await recorder.current.stopRecording();
      
      state.setIsRecording(false);
      state.setIsPaused(false);
      
      console.log('[useStopRecording] Recording stopped successfully');
      return result;
    } catch (error) {
      console.error('[useStopRecording] Error stopping recording:', error);
      throw error;
    }
  }, [recorder, state]);

  return {
    handleStopRecording
  };
}
