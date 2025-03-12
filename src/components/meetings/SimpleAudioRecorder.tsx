
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Cleanup
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
      chunksRef.current = [];
      setAudioUrl(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = { mimeType: 'audio/webm' };
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
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Reset state
        setIsRecording(false);
        
        // Clear the timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setIsLoading(false);
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
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Error starting recording", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setIsLoading(false);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  const handleSubmitAudio = async () => {
    if (!audioUrl) {
      toast.error("No recording available");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch audio data
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Audio = base64data.split(',')[1]; // Remove the data URL part
        
        // Prepare recording data
        const recordingInfo = {
          duration: recordingDuration,
          mimeType: blob.type
        };
        
        // Call Supabase edge function
        toast.info("Sending for transcription...");
        
        try {
          // Call the new JavaScript transcription edge function
          const { data, error } = await supabase.functions.invoke('transcribe-js', {
            body: {
              audioData: base64Audio,
              recordingData: recordingInfo
            }
          });
          
          if (error) {
            throw new Error(error.message || "Error transcribing audio");
          }
          
          console.log("Transcription response:", data);
          
          if (data.success) {
            // Wait 3 seconds before checking for the transcription
            toast.info("Processing your audio. Please wait...");
            onNewTranscription("Processing your audio. Please wait...");
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check transcription status
            const { data: transcription, error: transcriptionError } = await supabase
              .from('transcriptions')
              .select('*')
              .eq('id', data.transcriptionId)
              .single();
            
            if (transcriptionError) {
              throw new Error(`Error fetching transcription: ${transcriptionError.message}`);
            }
            
            if (transcription.status === 'completed') {
              onNewTranscription(transcription.content);
              toast.success("Transcription completed successfully");
            } else if (transcription.status === 'error') {
              throw new Error(`Transcription error: ${transcription.error_message || 'Unknown error'}`);
            } else {
              // For processing state, poll every 2 seconds for up to 30 seconds
              let attempts = 0;
              const maxAttempts = 15;
              
              const pollTranscription = async () => {
                attempts++;
                
                const { data: updatedTranscription, error: pollError } = await supabase
                  .from('transcriptions')
                  .select('*')
                  .eq('id', data.transcriptionId)
                  .single();
                
                if (pollError) {
                  throw new Error(`Error polling transcription: ${pollError.message}`);
                }
                
                if (updatedTranscription.status === 'completed') {
                  onNewTranscription(updatedTranscription.content);
                  toast.success("Transcription completed successfully");
                  return;
                } else if (updatedTranscription.status === 'error') {
                  throw new Error(`Transcription error: ${updatedTranscription.error_message || 'Unknown error'}`);
                } else if (attempts < maxAttempts) {
                  // Continue polling
                  setTimeout(pollTranscription, 2000);
                } else {
                  // Give up after max attempts
                  throw new Error("Transcription timed out. Please try again later.");
                }
              };
              
              // Start polling
              pollTranscription();
            }
          } else {
            throw new Error(data.error || "Unknown error in transcription");
          }
        } catch (invokeError) {
          console.error("Error invoking function:", invokeError);
          toast.error("Transcription error", {
            description: invokeError instanceof Error ? invokeError.message : "Unknown error"
          });
          setIsLoading(false);
          onNewTranscription("");
        }
      };
    } catch (error) {
      console.error("Error submitting audio:", error);
      toast.error("Error submitting audio", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setIsLoading(false);
    }
  };
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        {/* Timer display */}
        {(isRecording || elapsedTime > 0) && (
          <div className="text-center font-mono text-lg">
            {formatTime(elapsedTime)}
          </div>
        )}
        
        {/* Recording/Stop buttons */}
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Mic className="h-5 w-5 mr-2" />
              )}
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>
        
        {/* Audio preview */}
        {audioUrl && (
          <div className="mt-4">
            <audio src={audioUrl} controls className="w-full" />
            <Button
              onClick={handleSubmitAudio}
              disabled={isLoading}
              className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
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
