
import React, { useEffect } from "react";
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
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
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
  lastAction,
  permissionState = 'unknown'
}: RecordingMainProps) => {
  // Enhanced logging to track received props
  useEffect(() => {
    console.log('[RecordingMain] Props received:', {
      deviceSelectionReady,
      selectedDeviceId,
      audioDevicesCount: audioDevices.length,
      permissionState,
      audioDevicesList: audioDevices.map(d => ({
        id: d.deviceId,
        label: d.label || 'No label'
      }))
    });
  }, [deviceSelectionReady, selectedDeviceId, audioDevices, permissionState]);

  // Validate if selected device exists in list
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      console.log('[RecordingMain] Selected device validation:', {
        deviceExists,
        selectedDeviceId,
        availableDevices: audioDevices.map(d => d.deviceId)
      });
      
      // If selected device doesn't exist in the list but we have devices,
      // we could potentially auto-select the first device here
      if (!deviceExists && audioDevices.length > 0) {
        console.warn('[RecordingMain] Selected device not found in devices list. Consider selecting a valid device.');
      }
    }
  }, [selectedDeviceId, audioDevices]);

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
        permissionState={permissionState}
      />
    </div>
  );
};
