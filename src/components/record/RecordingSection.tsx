
import React, { useState, useEffect } from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { AudioDevice } from "@/hooks/recording/capture/types";

// Define all possible props that can be passed to this component
interface RecordingSectionProps {
  // Props passed from other components
  isRecording?: boolean;
  isPaused?: boolean;
  audioUrl?: string | null;
  mediaStream?: MediaStream | null;
  isSystemAudio?: boolean;
  handleStartRecording?: () => void;
  handleStopRecording?: () => void | Promise<void>;
  handlePauseRecording?: () => void;
  handleResumeRecording?: () => void;
  handleDelete?: () => void;
  onSystemAudioChange?: (value: boolean) => void;
  audioDevices?: AudioDevice[]; // Changed from MediaDeviceInfo[] to AudioDevice[]
  selectedDeviceId?: string | null;
  onDeviceSelect?: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  lastAction?: { action: string; timestamp: number; success: boolean; error?: string } | null;
  onRefreshDevices?: () => void | Promise<void>; // Allow void or Promise<void>
  devicesLoading?: boolean;
  permissionState?: "prompt" | "granted" | "denied" | "unknown";
}

export function RecordingSection(props: RecordingSectionProps = {}) {
  // Use context for device management when props aren't provided
  const deviceManager = useDeviceManager();
  
  // Determine whether to use props or context
  const permissionState = props.permissionState || deviceManager.permissionState;
  const selectedDeviceId = props.selectedDeviceId || deviceManager.selectedDeviceId;
  
  // Local state when not controlled externally
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // If isRecording is provided as a prop, use that instead of local state
  const recordingState = props.isRecording !== undefined ? props.isRecording : isRecording;
  
  const canRecord = permissionState === "granted" && !!selectedDeviceId && !recordingState;

  // Handle external recording state changes
  useEffect(() => {
    if (props.isRecording === false && timer) {
      clearInterval(timer);
      setTimer(null);
      setRecordingTime(0);
    }
  }, [props.isRecording, timer]);

  const handleStartRecording = async () => {
    if (!canRecord) return;
    
    if (props.handleStartRecording) {
      props.handleStartRecording();
    } else {
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
    }
  };

  const handleStopRecording = () => {
    if (props.handleStopRecording) {
      props.handleStopRecording();
    } else {
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
    }
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
          {recordingState && (
            <div className="text-center py-2 bg-red-50 border border-red-200 rounded-md text-red-600 animate-pulse">
              <div className="text-sm font-medium">Recording in progress</div>
              <div className="text-xl font-bold">{formatTime(recordingTime)}</div>
            </div>
          )}
          
          <div className="flex space-x-3">
            {!recordingState ? (
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
          
          {!canRecord && !recordingState && (
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
