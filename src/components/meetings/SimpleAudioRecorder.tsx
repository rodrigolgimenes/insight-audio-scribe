import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";

interface SimpleAudioRecorderProps {
  onNewTranscription: (text: string) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const SimpleAudioRecorder = ({
  onNewTranscription,
  isLoading,
  setIsLoading
}: SimpleAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);
  
  const startRecording = async () => {
    try {
      setIsLoading(true);
      setPermissionError(null);
      chunksRef.current = [];
      setAudioUrl(null);
      
      // Request microphone permission with fallback attempts
      let stream;
      try {
        // First attempt with detailed settings
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (initialError) {
        console.log("Initial attempt failed, trying simpler configuration", initialError);
        
        // Second attempt with simple configuration
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (fallbackError) {
          if (fallbackError instanceof DOMException) {
            if (fallbackError.name === 'NotAllowedError') {
              setPermissionError("Microphone access denied. Please allow access in your browser settings.");
              toast.error("Microphone access denied", {
                description: "Check your browser permission settings"
              });
            } else if (fallbackError.name === 'NotFoundError') {
              setPermissionError("No microphone found. Please connect a microphone and try again.");
              toast.error("No microphone found", {
                description: "Please connect a microphone and try again"
              });
            } else {
              setPermissionError(`Microphone error: ${fallbackError.message}`);
              toast.error("Microphone error", {
                description: fallbackError.message
              });
            }
          } else {
            setPermissionError("Unknown microphone error.");
            toast.error("Unknown error");
          }
          setIsLoading(false);
          return;
        }
      }
      
      // Check if we got a stream
      if (!stream) {
        setPermissionError("Failed to get audio stream");
        setIsLoading(false);
        return;
      }
      
      // Try to use high quality codecs with fallback
      let options;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const endTime = Date.now();
        const duration = recordingStartTime ? endTime - recordingStartTime : 0;
        setRecordingDuration(duration);
        
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Reset state
        setIsRecording(false);
        
        // Clear timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setIsLoading(false);
        
        // Audio and visual feedback that recording is complete
        toast.success("Recording completed", {
          description: `Duration: ${formatTime(Math.floor(duration / 1000))}`
        });
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      
      // Set start time and start timer
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setElapsedTime(0);
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      setIsRecording(true);
      setIsLoading(false);
      
      toast.success("Recording started", {
        description: "Speak into your microphone"
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      setPermissionError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Error starting recording", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setIsLoading(false);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      toast.info("Finalizing recording...");
    }
  };
  
  const handleSubmitAudio = async () => {
    if (!audioUrl) {
      toast.error("No audio available");
      return;
    }
    
    try {
      setIsLoading(true);
      setTranscriptionProgress(10);
      
      // Fetch audio data
      const response = await fetch(audioUrl);
      const originalBlob = await response.blob();
      
      // Compress the audio before transcription
      setTranscriptionProgress(20);
      toast.info("Compressing audio...");
      
      // Use our new audio compressor for voice optimization
      let audioBlob: Blob;
      try {
        audioBlob = await audioCompressor.compressAudio(originalBlob, {
          targetBitrate: 32,    // 32kbps for high compression
          mono: true,           // Convert to mono
          targetSampleRate: 16000 // 16kHz sample rate optimal for speech recognition
        });
        
        const originalSize = originalBlob.size;
        const compressedSize = audioBlob.size;
        const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
        
        console.log(`Audio compressed from ${(originalSize / (1024 * 1024)).toFixed(2)}MB to ${(compressedSize / (1024 * 1024)).toFixed(2)}MB (${compressionRatio}% reduction)`);
        
        if (compressionRatio > 10) {
          toast.success(`Audio compressed in ${compressionRatio}%`, {
            description: "This will speed up transcription"
          });
        }
      } catch (compressionError) {
        console.error("Error during compression:", compressionError);
        toast.warning("Compression failed, using original audio");
        audioBlob = originalBlob;
      }
      
      // Show feedback about file size
      const fileSizeMB = audioBlob.size / (1024 * 1024);
      console.log(`Audio file size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 25) {
        toast.warning("Large file detected", {
          description: `The file is ${fileSizeMB.toFixed(2)} MB. Transcription may take longer.`
        });
      }
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Audio = base64data.split(',')[1];
        
        setTranscriptionProgress(30);
        toast.info("Starting transcription...");
        
        try {
          setTranscriptionProgress(50);
          
          const { data, error } = await supabase.functions.invoke('transcribe-whisper-local', {
            body: { audioData: base64Audio }
          });
          
          setTranscriptionProgress(90);
          
          if (error) throw new Error(error.message);
          
          if (data.success) {
            onNewTranscription(data.transcription);
            setTranscriptionProgress(100);
            toast.success("Transcription completed successfully");
          } else {
            throw new Error(data.error || "Unknown error during transcription");
          }
        } catch (invokeError) {
          console.error("Error during transcription:", invokeError);
          toast.error("Transcription failed", {
            description: invokeError instanceof Error ? invokeError.message : "Unknown error"
          });
        } finally {
          setIsLoading(false);
        }
      };
    } catch (error) {
      console.error("Error sending audio:", error);
      toast.error("Error sending audio", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setIsLoading(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        {(isRecording || elapsedTime > 0) && (
          <div className="text-center font-mono text-xl">
            {formatTime(elapsedTime)}
          </div>
        )}
        
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Start Recording"
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Stop Recording"
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <StopCircle className="h-8 w-8" />
              )}
            </Button>
          )}
        </div>
        
        {permissionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Permission Error</p>
              <p className="text-red-600 text-sm">{permissionError}</p>
            </div>
          </div>
        )}
        
        {transcriptionProgress > 0 && (
          <div className="mt-4 space-y-2">
            <Progress value={transcriptionProgress} className="h-2" />
            <p className="text-xs text-gray-500 text-center">
              {transcriptionProgress < 100 
                ? `Transcribing: ${transcriptionProgress}%`
                : "Transcription complete"}
            </p>
          </div>
        )}
        
        {audioUrl && !isRecording && (
          <div className="mt-4 space-y-4">
            <audio src={audioUrl} controls className="w-full" />
            <Button 
              onClick={handleSubmitAudio} 
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                "Transcribe Audio"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
