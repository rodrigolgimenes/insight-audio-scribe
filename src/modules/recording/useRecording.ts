
import { useState, useCallback, useRef } from 'react';
import { RecordingState, RecordingOptions, RecordingResult } from './types';
import { AudioRecorder } from '@/utils/audio/audioRecorder';

export const useRecording = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    audioUrl: null,
    mediaStream: null,
    duration: 0,
    error: null
  });
  
  const recorder = useRef<AudioRecorder>(new AudioRecorder());
  
  const startRecording = useCallback(async (options: RecordingOptions) => {
    try {
      const constraints = {
        audio: {
          deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
          sampleRate: { ideal: options.sampleRate || 16000 },
          sampleSize: { ideal: options.sampleSize || 8 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      await recorder.current.startRecording(stream);
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        mediaStream: stream,
        error: null
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      }));
      return false;
    }
  }, []);
  
  const stopRecording = useCallback(async (): Promise<RecordingResult> => {
    try {
      const result = await recorder.current.stopRecording();
      
      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioUrl: url,
          mediaStream: null
        }));
      }
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop recording'
      }));
      return { blob: null, duration: 0, error: 'Failed to stop recording' };
    }
  }, []);
  
  const pauseRecording = useCallback(() => {
    recorder.current.pauseRecording();
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);
  
  const resumeRecording = useCallback(() => {
    recorder.current.resumeRecording();
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);
  
  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
};
