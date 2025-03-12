
import { useCallback } from "react";

export function useStartRecording(
  recorder: React.RefObject<any>,
  state: { 
    setIsRecording: (value: boolean) => void; 
    setIsPaused: (value: boolean) => void;
  }
) {
  const handleStartRecording = useCallback(async (stream: MediaStream) => {
    console.log('[useStartRecording] Starting recording with stream');
    
    if (!recorder.current) {
      throw new Error('Recorder not initialized');
    }

    try {
      await recorder.current.startRecording(stream);
      
      state.setIsRecording(true);
      state.setIsPaused(false);
      
      console.log('[useStartRecording] Recording started successfully');
    } catch (error) {
      console.error('[useStartRecording] Error starting recording:', error);
      throw error;
    }
  }, [recorder, state]);

  return {
    handleStartRecording
  };
}
