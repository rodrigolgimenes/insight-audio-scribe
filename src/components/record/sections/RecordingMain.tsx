
import React from "react";
import { AudioVisualizer } from "../AudioVisualizer";
import { RecordControls } from "../RecordControls";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingMainProps {
  isRecording: boolean;
  isPaused: boolean;
  mediaStream: MediaStream | null;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  deviceSelectionReady: boolean;
  selectedDeviceId: string | null;
  audioDevices: AudioDevice[];
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
}

export const RecordingMain = ({
  isRecording,
  isPaused,
  mediaStream,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  deviceSelectionReady,
  selectedDeviceId,
  audioDevices,
  lastAction
}: RecordingMainProps) => {
  return (
    <div className="flex flex-col items-center">
      <AudioVisualizer 
        mediaStream={mediaStream} 
        isRecording={isRecording} 
        isPaused={isPaused} 
      />
      
      <RecordControls 
        isRecording={isRecording} 
        isPaused={isPaused} 
        onStartRecording={handleStartRecording} 
        onStopRecording={handleStopRecording} 
        onPauseRecording={handlePauseRecording} 
        onResumeRecording={handleResumeRecording} 
        deviceSelectionReady={deviceSelectionReady}
        selectedDeviceId={selectedDeviceId}
        audioDevices={audioDevices}
        showLastAction={true}
        lastAction={lastAction}
      />
    </div>
  );
};
