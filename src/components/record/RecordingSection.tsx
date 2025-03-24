
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DeviceSelector } from "./DeviceSelector";
import { AudioPlayer } from "./AudioPlayer";
import { RecordControls } from "./RecordControls";
import { SystemAudioToggle } from "./SystemAudioToggle";
import { DeviceDebugInfo } from "./DeviceDebugInfo";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio?: boolean;
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => Promise<any>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange?: (value: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  lastAction?: { action: string; timestamp: number; success: boolean; error?: string; };
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  showPlayButton?: boolean;
  onSave?: () => Promise<{ success: boolean }>;
  isLoading?: boolean;
  suppressMessages?: boolean; // New prop to suppress messages
}

export function RecordingSection({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio = false,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  handleDelete,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  lastAction,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  showPlayButton = true,
  onSave,
  isLoading = false,
  suppressMessages = false // Default to false for backward compatibility
}: RecordingSectionProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Force permissionState to 'granted' if suppressMessages is true
  const effectivePermissionState = suppressMessages ? 'granted' : permissionState;
  
  // If suppressMessages is true, make sure we have at least one device
  const effectiveDevices = suppressMessages && audioDevices.length === 0 
    ? [{
        deviceId: "default-suppressed-device",
        groupId: "default-group",
        label: "Default Microphone",
        kind: "audioinput",
        isDefault: true,
        index: 0
      }] 
    : audioDevices;
  
  // Wrapper for save function
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Record Audio</h2>
      
      <div className="space-y-4">
        <DeviceSelector
          audioDevices={effectiveDevices}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={onDeviceSelect}
          disabled={isRecording}
          isReady={deviceSelectionReady}
          onRefreshDevices={onRefreshDevices}
          devicesLoading={devicesLoading}
          permissionState={effectivePermissionState}
        />
        
        {onSystemAudioChange && (
          <SystemAudioToggle
            isSystemAudio={isSystemAudio}
            onChange={onSystemAudioChange}
            disabled={isRecording}
          />
        )}
      </div>
      
      <div className="flex justify-center py-4">
        <RecordControls
          isRecording={isRecording}
          isPaused={isPaused}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
          deviceSelectionReady={deviceSelectionReady || suppressMessages} // Always allow recording if suppressMessages is true
          selectedDeviceId={selectedDeviceId}
          audioDevices={effectiveDevices}
          showLastAction={showDebug}
          lastAction={lastAction}
          permissionState={effectivePermissionState}
        />
      </div>
      
      {/* Only show debug info if specifically requested */}
      {showDebug && !suppressMessages && (
        <DeviceDebugInfo
          deviceCount={audioDevices.length}
          selectedDeviceId={selectedDeviceId}
          isLoading={devicesLoading}
          permissionState={permissionState}
        />
      )}
      
      {audioUrl && !isRecording && (
        <div className="space-y-4">
          <AudioPlayer
            audioUrl={audioUrl}
            showPlayButton={showPlayButton}
          />
          
          <div className="flex justify-between gap-2">
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
              disabled={isSaving || isLoading}
            >
              Delete
            </Button>
            
            {onSave && (
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isSaving || isLoading}
              >
                {(isSaving || isLoading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Recording"
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
