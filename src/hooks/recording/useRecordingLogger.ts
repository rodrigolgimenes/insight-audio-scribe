
import { useEffect } from "react";

/**
 * Hook for logging recording state changes
 */
export const useRecordingLogger = (
  isRecording: boolean,
  isPaused: boolean,
  audioUrl: string | null,
  mediaStream: MediaStream | null,
  selectedDeviceId: string | null,
  deviceSelectionReady: boolean,
  recordingAttemptsCount: number,
  isSystemAudio: boolean,
  lastAction: { action: string; timestamp: number; success: boolean; error?: string } | null
) => {
  // Log state changes for debugging
  useEffect(() => {
    console.log('[useRecordingLogger] State updated:', { 
      isRecording, 
      isPaused, 
      audioUrl: audioUrl ? 'exists' : 'null',
      mediaStream: mediaStream ? 'exists' : 'null',
      selectedDeviceId,
      deviceSelectionReady,
      recordingAttemptsCount,
      isSystemAudio,
      lastAction
    });
    
    // Add console logs to see browser support for MediaRecorder
    if (typeof window !== 'undefined') {
      console.log('[useRecordingLogger] MediaRecorder supported:', 'MediaRecorder' in window);
      if ('MediaRecorder' in window) {
        console.log('[useRecordingLogger] MediaRecorder.isTypeSupported:', 
          'audio/webm;codecs=opus', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
          'audio/webm', MediaRecorder.isTypeSupported('audio/webm'),
          'audio/mp4', MediaRecorder.isTypeSupported('audio/mp4')
        );
      }
    }
  }, [isRecording, isPaused, audioUrl, mediaStream, selectedDeviceId, deviceSelectionReady, recordingAttemptsCount, isSystemAudio, lastAction]);
};
