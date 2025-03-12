
import { useCallback, useRef } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { RecordingObserver } from "@/utils/audio/types/audioRecorderTypes";

export function useRecorderInit(
  recorderRef: React.RefObject<AudioRecorder>,
  onRecordingEvent?: RecordingObserver
) {
  // Track recording duration
  const durationRef = useRef<number>(0);
  const durationTimerRef = useRef<number | null>(null);
  
  // Initialize recorder and setup observer if provided
  const initializeRecorder = useCallback(() => {
    console.log('[useRecorderInit] Initializing recorder');
    
    if (recorderRef.current && onRecordingEvent) {
      recorderRef.current.addObserver(onRecordingEvent);
    }
    
    return () => {
      console.log('[useRecorderInit] Cleaning up recorder');
      if (recorderRef.current && onRecordingEvent) {
        recorderRef.current.removeObserver(onRecordingEvent);
      }
      
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [recorderRef, onRecordingEvent]);
  
  // Get current duration
  const getCurrentDuration = useCallback(() => {
    if (recorderRef.current) {
      return recorderRef.current.getCurrentDuration();
    }
    return durationRef.current;
  }, [recorderRef]);
  
  return {
    initializeRecorder,
    getCurrentDuration
  };
}
