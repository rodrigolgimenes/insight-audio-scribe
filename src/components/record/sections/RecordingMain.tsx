
import React, { useEffect, useState, useRef } from "react";
import { AudioVisualizer } from "../AudioVisualizer";
import { RecordControls } from "../RecordControls";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { RecordingValidator } from "@/utils/audio/recordingValidator";

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
  // Track when we need to force selection of a default device
  const hasLoggedDeviceStateRef = useRef(false);
  const [validationStatus, setValidationStatus] = useState<{
    canStartRecording: boolean;
    issues: string[];
  }>({ canStartRecording: false, issues: [] });

  // Log device state just once to avoid excessive logging
  useEffect(() => {
    if (!hasLoggedDeviceStateRef.current && audioDevices.length > 0) {
      console.log('[RecordingMain] Device state:', {
        deviceSelectionReady,
        selectedDeviceId,
        audioDevicesCount: audioDevices.length,
        permissionState,
        audioDevicesList: audioDevices.slice(0, 2).map(d => ({
          id: d.deviceId,
          label: d.label || 'No label'
        }))
      });
      hasLoggedDeviceStateRef.current = true;
    }
    
    // Re-validate when props change
    const diagnostics = RecordingValidator.validatePrerequisites({
      selectedDeviceId,
      deviceSelectionReady,
      audioDevices,
      permissionState
    });
    
    setValidationStatus({
      canStartRecording: diagnostics.canStartRecording,
      issues: diagnostics.issues
    });
  }, [deviceSelectionReady, selectedDeviceId, audioDevices, permissionState]);

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
      
      {validationStatus.issues.length > 0 && permissionState !== 'denied' && (
        <div className="mt-4 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <p className="font-medium">Recording may not work correctly:</p>
          <ul className="list-disc pl-5 mt-1">
            {validationStatus.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
