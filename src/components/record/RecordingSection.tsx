
import React, { useState, useEffect } from "react";
import { RecordHeader } from "./RecordHeader";
import { RecordTimer } from "./RecordTimer";
import { RecordControls } from "./RecordControls";
import { AudioVisualizer } from "./AudioVisualizer";
import { DeviceSelector } from "./DeviceSelector";
import { SystemAudioToggle } from "./SystemAudioToggle";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio?: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete?: () => void;
  onSystemAudioChange?: (isSystemAudio: boolean) => void;
  audioDevices: MediaDeviceInfo[] | AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  showDiagnosticsPanel?: boolean;
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
  onRefreshDevices?: () => void;
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
  showPlayButton = true,
  showDeleteButton = false,
  showDiagnosticsPanel = true,
  lastAction,
  onRefreshDevices,
}: RecordingSectionProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.log('[RecordingSection] Props updated:', { 
      isRecording, 
      isPaused, 
      hasAudioUrl: !!audioUrl, 
      hasMediaStream: !!mediaStream,
      deviceSelectionReady,
      deviceCount: audioDevices.length 
    });
  }, [isRecording, isPaused, audioUrl, mediaStream, deviceSelectionReady, audioDevices]);

  return (
    <div className="space-y-4">
      <RecordHeader 
        isRecording={isRecording} 
        isPaused={isPaused} 
      />
      
      <RecordTimer 
        isRecording={isRecording} 
        isPaused={isPaused} 
      />
      
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
          showLastAction={true}
          lastAction={lastAction}
        />
      </div>
      
      <div className="mt-6 space-y-4">
        <DeviceSelector 
          devices={audioDevices} 
          selectedDeviceId={selectedDeviceId} 
          onDeviceSelect={onDeviceSelect} 
          isReady={deviceSelectionReady} 
        />
        
        {onSystemAudioChange && (
          <SystemAudioToggle 
            isSystemAudio={isSystemAudio} 
            onSystemAudioChange={onSystemAudioChange} 
          />
        )}
      </div>
      
      {showDeleteButton && handleDelete && audioUrl && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete recording
          </Button>
        </div>
      )}
      
      {showDiagnosticsPanel && (
        <DiagnosticsPanel
          isRecording={isRecording}
          isPaused={isPaused}
          mediaStream={mediaStream}
          deviceSelectionReady={deviceSelectionReady}
          deviceId={selectedDeviceId}
          lastAction={lastAction}
          onRefreshDevices={onRefreshDevices}
        />
      )}
    </div>
  );
}
