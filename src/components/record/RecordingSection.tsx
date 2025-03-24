
import React from "react";
import { DeviceSelector } from "@/components/record/DeviceSelector";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play, Trash, Save, Loader2 } from "lucide-react";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => Promise<any>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: any[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  lastAction: any;
  onRefreshDevices?: () => Promise<any>;
  devicesLoading: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  isRestrictedRoute?: boolean;
  onSave?: () => Promise<any>;
  isLoading?: boolean;
  isSaving?: boolean;
  showNoDevicesWarning?: boolean;
  processingProgress?: number;
  processingStage?: string;
}

export function RecordingSection({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio,
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
  showDeleteButton = true,
  isRestrictedRoute = false,
  onSave,
  isLoading = false,
  isSaving = false,
  showNoDevicesWarning = true,
  processingProgress = 0,
  processingStage = ""
}: RecordingSectionProps) {
  return (
    <div className="space-y-6">
      <DeviceSelector 
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        disabled={isRecording || devicesLoading}
        isReady={deviceSelectionReady}
        onRefreshDevices={onRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
        showNoDevicesWarning={showNoDevicesWarning}
      />
      
      <div className="flex flex-wrap gap-3 mt-4">
        {!isRecording && !audioUrl && (
          <Button
            onClick={handleStartRecording}
            disabled={isLoading || !deviceSelectionReady}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        )}
        
        {isRecording && !isPaused && (
          <Button onClick={handlePauseRecording} variant="outline" className="border-primary text-primary">
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}
        
        {isRecording && isPaused && (
          <Button onClick={handleResumeRecording} variant="outline" className="border-primary text-primary">
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        )}
        
        {isRecording && (
          <Button onClick={handleStopRecording} variant="destructive">
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        )}
        
        {audioUrl && showDeleteButton && (
          <Button onClick={handleDelete} variant="destructive">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
        
        {audioUrl && onSave && (
          <Button 
            onClick={onSave} 
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Recording
              </>
            )}
          </Button>
        )}
      </div>
      
      {processingProgress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{processingStage || "Processing..."} ({processingProgress}%)</p>
        </div>
      )}
      
      {audioUrl && showPlayButton && (
        <div className="mt-4">
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
}
