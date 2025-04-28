import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type RecorderStatus = 'idle' | 'recording' | 'saving' | 'error';

interface RecorderOptions {
  timeslice?: number;
  onDataAvailable?: (blob: Blob) => void;
}

interface RecordingResult {
  blob: Blob;
  duration: number;
  audioUrl: string;
}

export const useRecorder = (options?: RecorderOptions) => {
  // State for tracking recording status
  const [status, setStatus] = useState<RecorderStatus>('idle');
  // Audio data
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  // Recording time tracking
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  // Refs for media resources
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Clean up function to release resources
  const cleanup = useCallback(() => {
    // Clear timer if it exists
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context if it exists
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    // Reset media recorder
    mediaRecorderRef.current = null;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Revoke object URL to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      cleanup();
    };
  }, [cleanup, audioUrl]);

  // Start recording function
  const start = useCallback(async (includeSystemAudio: boolean = false) => {
    try {
      // Reset previous recording data
      setAudioBlob(null);
      setAudioUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      setDuration(0);
      setRecordingTime(0);
      chunksRef.current = [];

      // Set up media constraints
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: false
      };
      
      let stream: MediaStream;
      
      // Handle system audio recording if requested (Chrome only)
      if (includeSystemAudio && navigator.mediaDevices.getDisplayMedia) {
        try {
          // Get display media for system audio
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { height: 0, width: 0 },
            audio: true 
          });
          
          // Get user media for microphone
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Combine the tracks
          const tracks = [
            ...displayStream.getAudioTracks(),
            ...micStream.getAudioTracks()
          ];
          
          // Create a new stream with all audio tracks
          stream = new MediaStream(tracks);
        } catch (err) {
          console.error('Failed to get system audio:', err);
          // Fall back to just microphone
          toast.error('System audio capture failed, using microphone only', {
            duration: 3000
          });
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      } else {
        // Standard microphone recording
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      // Keep reference to stream
      streamRef.current = stream;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // Call onDataAvailable callback if provided
          if (options?.onDataAvailable) {
            options.onDataAvailable(event.data);
          }
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Get the final blob that contains the recording
        const finalBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(finalBlob);
        
        // Create URL for the audio blob
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        
        // Calculate final duration
        const finalDuration = Date.now() - startTimeRef.current;
        setDuration(finalDuration);
        
        // Update status
        setStatus('idle');
      };

      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording failed', {
          description: 'There was an error during recording. Please try again.',
          duration: 3000
        });
        setStatus('error');
        cleanup();
      };

      // Start the recording
      mediaRecorder.start(options?.timeslice || undefined);
      setStatus('recording');
      
      // Track start time
      startTimeRef.current = Date.now();
      
      // Start timer to update recording time
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Date.now() - startTimeRef.current);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      
      // Show appropriate error message based on error type
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error('Microphone access denied', {
          description: 'Please allow microphone access to record audio.',
          duration: 5000
        });
      } else {
        toast.error('Failed to start recording', {
          description: 'Please check your microphone connection.',
          duration: 3000
        });
      }
      
      setStatus('error');
      cleanup();
      return false;
    }
  }, [cleanup, options]);

  // Stop recording function
  const stop = useCallback((): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || status !== 'recording') {
        resolve(null);
        return;
      }

      // First request data to ensure we get everything
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          console.warn('Error requesting data:', e);
        }
      }

      // Set up one-time event listener for when recording stops
      const handleStop = () => {
        // Calculate final duration
        const recordingDuration = Date.now() - startTimeRef.current;
        
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Create the final blob
        const finalBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Create URL for playback
        const url = URL.createObjectURL(finalBlob);
        
        // Check if recording is too short
        if (recordingDuration < 500) {
          toast.warning('Recording is too short', {
            description: 'Please record for at least 1 second.',
            duration: 3000
          });
          
          // Clean up the created URL
          URL.revokeObjectURL(url);
          
          // Clean up the recording resources
          cleanup();
          
          resolve(null);
          return;
        }
        
        // Update state with the recording data
        setAudioBlob(finalBlob);
        setAudioUrl(url);
        setDuration(recordingDuration);
        
        // Release media resources
        cleanup();
        
        // Resolve with recording result
        resolve({
          blob: finalBlob,
          duration: recordingDuration,
          audioUrl: url
        });
      };

      try {
        // Set up the stop event handler
        mediaRecorderRef.current.addEventListener('stop', handleStop, { once: true });
        
        // Stop the recording
        mediaRecorderRef.current.stop();
        
        // Update status to saving
        setStatus('saving');
      } catch (error) {
        console.error('Failed to stop recording:', error);
        cleanup();
        setStatus('error');
        resolve(null);
      }
    });
  }, [status, cleanup]);

  // Return the recorder controls and state
  return {
    status,
    audioBlob,
    audioUrl,
    duration,
    recordingTime,
    start,
    stop
  };
};
