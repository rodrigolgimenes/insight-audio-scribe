import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

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

  // FIX: Only run cleanup when component unmounts, not when isRecording or audioUrl change
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      cleanup();
    };
  }, []); // Empty dependency array - only run on unmount

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
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("Microphone access granted, initializing MediaRecorder");
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
        console.log("Using audio/webm;codecs=opus format");
      } else {
        console.log("Opus codec not supported, using default format");
      }
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      console.log("MediaRecorder created with mime type:", mediaRecorder.mimeType);
      
      // Important: Set up event handlers BEFORE starting recording
      console.log("Setting up MediaRecorder event handlers");
      
      // Handle data available events
      mediaRecorder.ondataavailable = (e) => {
        console.log(`MediaRecorder ondataavailable: chunk size = ${e.data.size}`);
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`Total chunks: ${chunksRef.current.length}`);
        }
      };
      
      // Handle stop event
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder onstop event triggered");
        
        // Calculate duration
        const endTime = Date.now();
        const duration = recordingStartTime ? Math.max(0, endTime - recordingStartTime) : 0;
        console.log(`Recording duration: ${duration}ms`);
        setRecordingDuration(duration);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
        
        // Clear timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Process recorded chunks with a small delay to ensure all chunks are processed
        setTimeout(() => {
          console.log(`Processing ${chunksRef.current.length} chunks to create blob`);
          
          // Create a blob from chunks
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { 
              type: mediaRecorder.mimeType || 'audio/webm' 
            });
            
            console.log(`Created blob: size=${blob.size}, type=${blob.type}`);
            
            if (blob.size > 0) {
              const url = URL.createObjectURL(blob);
              setAudioUrl(url);
              console.log(`Audio URL created: ${url}`);
              setIsRecording(false);
              toast.success("Recording completed");
            } else {
              console.error("Created blob is empty");
              setIsRecording(false);
              toast.error("Failed to create recording: Empty data");
            }
          } else {
            console.error("No audio chunks recorded");
            setIsRecording(false);
            toast.error("Failed to create recording: No data captured");
          }
        }, 300); // Add a small delay to ensure all chunks are collected
      };
      
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        cleanup();
      };
      
      // Start the media recorder
      try {
        console.log("Starting MediaRecorder...");
        mediaRecorder.start(1000); // Collect data every second
        
        const startTime = Date.now();
        setRecordingStartTime(startTime);
        setElapsedTime(0);
        
        timerRef.current = window.setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
        
        setIsRecording(true);
        toast.success("Recording started");
        console.log("MediaRecorder successfully started");
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
      console.log("stopRecording called, current state:", {
        isRecording,
        mediaRecorderState: mediaRecorderRef.current?.state || "no recorder"
      });
      
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
          
          // Create a local reference to chunks and mimeType for use in the timeout handler
          const currentChunks = [...chunksRef.current];
          const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
          const currentStartTime = recordingStartTime;
          
          // Set up a safety timeout in case onstop event doesn't fire
          const safetyTimeout = setTimeout(() => {
            console.warn("Safety timeout triggered - onstop event might not have fired");
            
            if (currentChunks.length === 0) {
              console.error("No audio chunks recorded (safety handler)");
              reject(new Error("No audio data captured"));
              return;
            }
            
            // Calculate duration
            const endTime = Date.now();
            const duration = currentStartTime ? Math.max(0, endTime - currentStartTime) : 0;
            setRecordingDuration(duration);
            
            // Create blob from saved chunks
            const blob = new Blob(currentChunks, { type: mimeType });
            
            if (blob.size <= 0) {
              console.error("Created blob is empty (safety handler)");
              reject(new Error("Empty audio data"));
              return;
            }
            
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setIsRecording(false);
            
            // Resolve the promise with blob and duration
            resolve({blob, duration: duration / 1000}); // Convert to seconds
          }, 1500);
          
          // CRITICAL FIX: The proper way to handle mediaRecorder events
          const originalOnStop = mediaRecorderRef.current.onstop;
          
          // Override the onstop handler
          mediaRecorderRef.current.onstop = (event) => {
            // Clear the safety timeout since onstop fired normally
            clearTimeout(safetyTimeout);
            
            // Call the original onstop handler if it exists
            if (originalOnStop) {
              originalOnStop.call(mediaRecorderRef.current, event);
            }
            
            try {
              console.log("MediaRecorder stopped event triggered in promise handler");
              const endTime = Date.now();
              const duration = currentStartTime ? Math.max(0, endTime - currentStartTime) : 0;
              
              // Small delay to ensure all chunks are processed
              setTimeout(() => {
                // Make sure we have chunks to process
                if (chunksRef.current.length === 0) {
                  console.error("No audio chunks recorded in promise handler");
                  reject(new Error("No audio data captured"));
                  return;
                }
                
                const blob = new Blob(chunksRef.current, { 
                  type: mimeType
                });
                
                // Validate blob
                if (blob.size <= 0) {
                  console.error("Created blob is empty in promise handler");
                  reject(new Error("Empty audio data"));
                  return;
                }
                
                console.log(`Blob created successfully: size=${blob.size}, type=${blob.type}`);
                
                // Resolve the promise with blob and duration
                resolve({blob, duration: duration / 1000}); // Convert to seconds
              }, 300);
            } catch (error) {
              console.error("Error in mediaRecorder.onstop promise handler:", error);
              reject(error);
            }
          };
          
          // Now call stop() after the onstop handler has been set up
          mediaRecorderRef.current.stop();
          console.log("MediaRecorder.stop() called");
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
