
import React, { useEffect, useState } from "react";
import { AudioVisualizer } from "../AudioVisualizer";
import { RecordControls } from "../RecordControls";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

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
  const [hasAttemptedDeviceSelection, setHasAttemptedDeviceSelection] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    canStartRecording: boolean;
    issues: string[];
  }>({ canStartRecording: false, issues: [] });

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
    
    // Re-validate when props change
    const issues = [];
    
    if (!audioDevices.length) {
      issues.push('No microphones detected');
    }
    
    if (!selectedDeviceId && audioDevices.length > 0) {
      issues.push('No microphone selected');
    }
    
    if (permissionState === 'denied') {
      issues.push('Microphone access denied');
    }
    
    setValidationStatus({
      canStartRecording: issues.length === 0,
      issues
    });
  }, [deviceSelectionReady, selectedDeviceId, audioDevices, permissionState]);

  // Handle microphone auto-selection if permission is granted but no device is selected
  useEffect(() => {
    // Only proceed if permissions are granted
    if (permissionState === 'granted' && audioDevices.length > 0 && !hasAttemptedDeviceSelection) {
      console.log('[RecordingMain] Permission granted with available devices, checking selection...');
      
      // Check if we need to select a device
      if (!selectedDeviceId || !audioDevices.some(d => d.deviceId === selectedDeviceId)) {
        console.log('[RecordingMain] No valid device selected, should select first available device');
        setHasAttemptedDeviceSelection(true);
        
        // Show toast about devices being found (this will be handled by parent component actually making the selection)
        toast.info(`Found ${audioDevices.length} microphones`, {
          description: "Recording is now ready",
          id: "mic-autodetect"
        });
      }
    }
  }, [permissionState, audioDevices, selectedDeviceId, hasAttemptedDeviceSelection]);

  // Validate if selected device exists in list
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      console.log('[RecordingMain] Selected device validation:', {
        deviceExists,
        selectedDeviceId,
        availableDevices: audioDevices.map(d => d.deviceId)
      });
      
      // If selected device doesn't exist in the list but we have devices, show a warning
      if (!deviceExists && audioDevices.length > 0) {
        console.warn('[RecordingMain] Selected device not found in devices list. Consider selecting a valid device.');
        
        // In a real app you might want to auto-select here, but we're just warning for now
        // to avoid unexpected behavior for the user
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
        handleStartRecording={handleStartRecording} 
        handleTranscribe={handleStopRecording}
        handlePauseRecording={handlePauseRecording} 
        handleResumeRecording={handleResumeRecording} 
        permissionState={permissionState}
      />
      
      {validationStatus.issues.length > 0 && (
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
