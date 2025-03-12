
import { useCallback, useRef } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export const useSimpleRecorder = () => {
  // Create recorder ref
  const recorderRef = useRef<AudioRecorder | null>(null);
  
  // Lazy initialize
  if (!recorderRef.current) {
    recorderRef.current = new AudioRecorder();
  }
  
  // Get current duration
  const getCurrentDuration = useCallback(() => {
    if (recorderRef.current) {
      return recorderRef.current.getCurrentDuration();
    }
    return 0;
  }, []);
  
  // Initialize recorder - returns a cleanup function
  const initializeRecorder = useCallback(() => {
    console.log('[useSimpleRecorder] Initializing recorder');
    
    // Make sure recorder is created
    if (!recorderRef.current) {
      recorderRef.current = new AudioRecorder();
    }
    
    return () => {
      console.log('[useSimpleRecorder] Cleaning up recorder');
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
    };
  }, []);
  
  return {
    recorder: recorderRef,
    isRecording: false,
    isPaused: false,
    getCurrentDuration,
    initializeRecorder,
    lastAction: null
  };
};
