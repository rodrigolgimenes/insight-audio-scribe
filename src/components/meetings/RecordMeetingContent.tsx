import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Pause, PlayCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRecording } from "@/hooks/useRecording";
import { TestDeviceSelector } from "./TestDeviceSelector";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordMeetingContentProps {
  isLoading: boolean;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (transcription: string) => void;
  onError: (error: string) => void;
}

export function RecordMeetingContent({
  isLoading,
  isUploading,
  onUploadStart,
  onUploadComplete,
  onError
}: RecordMeetingContentProps) {
  const recordingHook = useRecording();
  const [savingProgress, setSavingProgress] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (recordingHook.isRecording && !recordingHook.isPaused) {
      interval = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingHook.isRecording, recordingHook.isPaused]);
  
  useEffect(() => {
    if (!recordingHook.isRecording) {
      setRecordingTimer(0);
    }
  }, [recordingHook.isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleTranscribe = async () => {
    if (!recordingHook.audioUrl) {
      toast.error("No recording to transcribe");
      return;
    }
    
    try {
      onUploadStart();
      setSavingProgress(10);
      
      if (recordingHook.isRecording) {
        await recordingHook.handleStopRecording();
      }
      
      setSavingProgress(30);
      
      const response = await fetch(recordingHook.audioUrl);
      const blob = await response.blob();
      
      setSavingProgress(50);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;
      
      setSavingProgress(70);
      
      toast.info("Sending for transcription...");
      const { data, error } = await supabase.functions.invoke('transcribe-meeting', {
        body: { 
          audioData: base64Data,
          recordingData: {
            duration: recordingHook.getCurrentDuration() || 0,
            mimeType: blob.type
          }
        }
      });
      
      setSavingProgress(100);
      
      if (error) {
        throw new Error(error.message || "Error transcribing audio");
      }
      
      if (data && data.transcription) {
        onUploadComplete(data.transcription);
      } else {
        throw new Error("Could not get transcription");
      }
      
    } catch (error) {
      console.error("[RecordMeetingContent] Error saving recording:", error);
      onError(error instanceof Error ? error.message : "Unknown error saving recording");
      toast.error("Error processing recording", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSavingProgress(0);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Record Audio</h2>
          </div>
          {recordingHook.isRecording && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <span className="h-2 w-2 bg-white rounded-full mr-1 animate-pulse"></span>
              Recording
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="h-16 bg-gray-100 rounded-md mb-4 flex items-center justify-center">
            {recordingHook.isRecording ? (
              <div className="h-0.5 w-full max-w-[90%] bg-blue-500 relative">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-3 w-3 bg-blue-500 rounded-full"></div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Ready to record</div>
            )}
          </div>
          
          {recordingHook.isRecording && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium">Recording</span>
              </div>
              <div className="text-sm">{formatTime(recordingTimer)}</div>
            </div>
          )}
          
          <div className="mb-4">
            <TestDeviceSelector 
              audioDevices={recordingHook.audioDevices as AudioDevice[]}
              selectedDeviceId={recordingHook.selectedDeviceId}
              onDeviceSelect={recordingHook.setSelectedDeviceId}
              isLoading={recordingHook.devicesLoading}
              label="Audio Device"
            />
          </div>
          
          <div className="space-y-3">
            {!recordingHook.isRecording ? (
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isLoading || !recordingHook.deviceSelectionReady}
                onClick={recordingHook.handleStartRecording}
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <div className="space-y-3">
                {!recordingHook.isPaused ? (
                  <Button 
                    className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    onClick={recordingHook.handlePauseRecording}
                    disabled={isLoading}
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause Recording
                  </Button>
                ) : (
                  <Button 
                    className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    onClick={recordingHook.handleResumeRecording}
                    disabled={isLoading}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Resume Recording
                  </Button>
                )}
                
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={recordingHook.handleStopRecording}
                  disabled={isLoading}
                >
                  <StopCircle className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              </div>
            )}
            
            {recordingHook.audioUrl && (
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleTranscribe}
                disabled={isLoading || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing ({savingProgress}%)
                  </>
                ) : (
                  <>
                    <span className="mr-2">TRANSCRIBE</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          {recordingHook.audioUrl && !recordingHook.isRecording && (
            <div className="mt-4">
              <audio 
                src={recordingHook.audioUrl} 
                controls 
                className="w-full" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
