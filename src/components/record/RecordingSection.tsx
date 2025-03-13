
import React, { useState } from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

export function RecordingSection() {
  const { permissionState, selectedDeviceId } = useDeviceManager();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const canRecord = permissionState === "granted" && !!selectedDeviceId && !isRecording;

  const handleStartRecording = async () => {
    if (!canRecord) return;
    
    try {
      console.log("[RecordingSection] Starting recording with device:", selectedDeviceId);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId || undefined }
      });
      
      console.log("[RecordingSection] Stream obtained:", stream.getAudioTracks().length, "audio tracks");
      setIsRecording(true);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimer(interval);
      
      toast.success("Recording started", {
        description: "Recording with selected microphone"
      });
      
      // This would be where MediaRecorder is initialized in a real implementation
    } catch (error) {
      console.error("[RecordingSection] Failed to start recording:", error);
      toast.error("Recording failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    console.log("[RecordingSection] Stopping recording");
    setIsRecording(false);
    
    // Clear timer
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    setRecordingTime(0);
    
    toast.info("Recording stopped", {
      description: "Your recording has been stopped"
    });
    
    // This would be where MediaRecorder is stopped in a real implementation
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Record Audio</h3>
        <MicrophoneSelector />

        <div className="mt-6 space-y-4">
          {isRecording && (
            <div className="text-center py-2 bg-red-50 border border-red-200 rounded-md text-red-600 animate-pulse">
              <div className="text-sm font-medium">Recording in progress</div>
              <div className="text-xl font-bold">{formatTime(recordingTime)}</div>
            </div>
          )}
          
          <div className="flex space-x-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={!canRecord}
                className={`flex-1 py-3 rounded-md flex items-center justify-center space-x-2 ${
                  canRecord 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Mic className="h-5 w-5" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-md flex items-center justify-center space-x-2"
              >
                <Square className="h-5 w-5" />
                <span>Stop Recording</span>
              </button>
            )}
          </div>
          
          {!canRecord && !isRecording && (
            <div className="text-xs text-center text-amber-600">
              {!selectedDeviceId ? (
                <p>Please select a microphone to enable recording</p>
              ) : permissionState !== "granted" ? (
                <p>Microphone permission is required to record audio</p>
              ) : (
                <p>Unable to start recording at this time</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
