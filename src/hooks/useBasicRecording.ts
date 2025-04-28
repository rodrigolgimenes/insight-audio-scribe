
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
      
      // Set up event handlers before starting recording
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
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
    return new Promise<{blob: Blob | null; duration: number}>((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        console.warn("No active recording to stop");
        setIsRecording(false);
        cleanup();
        resolve({blob: null, duration: 0});
        return;
      }

      try {
        // Check if MediaRecorder is in a state where it can be stopped
        if (mediaRecorderRef.current.state !== 'inactive') {
          console.log("Stopping MediaRecorder...");
          
          // CRITICAL FIX: Set up the onstop handler BEFORE calling stop()
          mediaRecorderRef.current.onstop = () => {
            try {
              console.log("MediaRecorder stopped event triggered");
              const endTime = Date.now();
              const duration = recordingStartTime ? Math.max(0, endTime - recordingStartTime) : 0;
              setRecordingDuration(duration);
              
              // Make sure we have chunks to process
              if (chunksRef.current.length === 0) {
                console.error("No audio chunks recorded");
                reject(new Error("No audio data captured"));
                return;
              }
              
              const blob = new Blob(chunksRef.current, { 
                type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
              });
              
              // Validate blob
              if (blob.size <= 0) {
                console.error("Created blob is empty");
                reject(new Error("Empty audio data"));
                return;
              }
              
              const url = URL.createObjectURL(blob);
              setAudioUrl(url);
              
              // Stop all active tracks
              if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
              }
              
              setIsRecording(false);
              
              // Clear timer after updating state
              if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              toast.success("Recording completed");
              resolve({blob, duration: duration / 1000}); // Convert to seconds
            } catch (error) {
              console.error("Error in mediaRecorder.onstop:", error);
              reject(new Error("Error finalizing recording"));
            }
          };
          
          // Now call stop() after the onstop handler has been set up
          mediaRecorderRef.current.stop();
        } else {
          console.warn("MediaRecorder already inactive");
          setIsRecording(false);
          cleanup();
          resolve({blob: null, duration: 0});
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast.error("Error stopping recording");
        
        // Force state update even if stopping fails
        setIsRecording(false);
        
        // Try to clean up the MediaRecorder
        cleanup();
        reject(error);
      }
    });
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
