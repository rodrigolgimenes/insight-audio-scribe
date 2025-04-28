
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useBasicRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Cleanup function to safely release resources
  const cleanup = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop MediaRecorder if it's active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping media recorder during cleanup:", error);
      }
    }
    
    // Stop all media tracks if still active
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error("Error stopping media tracks during cleanup:", error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up AudioURL if any
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      cleanup();
    };
  }, [isRecording, audioUrl]);

  // Handle setting audioUrl to null and resetting elapsed time
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setElapsedTime(0);
  };

  const startRecording = async () => {
    try {
      setPermissionError(null);
      chunksRef.current = [];
      resetRecording();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          const endTime = Date.now();
          const duration = recordingStartTime ? Math.max(0, endTime - recordingStartTime) : 0;
          setRecordingDuration(duration);
          
          // Make sure we have chunks to process
          if (chunksRef.current.length === 0) {
            console.error("No audio chunks recorded");
            toast.error("Recording failed - no audio data captured");
            return;
          }
          
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          
          // Validate blob
          if (blob.size <= 0) {
            console.error("Created blob is empty");
            toast.error("Recording failed - empty audio data");
            return;
          }
          
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          // Stop all active tracks
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          setIsRecording(false);
          
          // Clear timer after updating state
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          toast.success("Recording completed");
        } catch (error) {
          console.error("Error in mediaRecorder.onstop:", error);
          toast.error("Error finalizing recording");
          setIsRecording(false);
        }
      };
      
      // Start the media recorder
      try {
        mediaRecorder.start(1000);
        mediaRecorderRef.current = mediaRecorder;
        
        const startTime = Date.now();
        setRecordingStartTime(startTime);
        setElapsedTime(0);
        
        timerRef.current = window.setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
        
        setIsRecording(true);
        toast.success("Recording started");
      } catch (startError) {
        console.error("Error starting MediaRecorder:", startError);
        toast.error("Failed to start recording");
        cleanup();
        throw startError;
      }
      
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPermissionError("Please allow microphone access to record");
        toast.error("Microphone access denied");
      } else {
        setPermissionError("Error accessing microphone");
        toast.error("Error starting recording");
      }
      cleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        
        // Make sure we don't leave timer running
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast.error("Error stopping recording");
        
        // Force state update even if stopping fails
        setIsRecording(false);
        
        // Try to clean up the MediaRecorder
        cleanup();
      }
    } else if (isRecording) {
      // MediaRecorder is no longer available but we're still in recording state
      console.warn("MediaRecorder not available but recording state is true");
      setIsRecording(false);
      cleanup();
    }
  };

  return {
    isRecording,
    audioUrl,
    elapsedTime,
    permissionError,
    recordingDuration,
    startRecording,
    stopRecording,
    setAudioUrl: resetRecording
  };
};
