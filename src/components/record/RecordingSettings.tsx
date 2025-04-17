
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, MicOff, Mic } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";

interface RecordingSettingsProps {
  isSystemAudio: boolean;
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  isRecording: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: PermissionState;
  disabled?: boolean;
}

export function RecordingSettings({
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  isRecording,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  disabled = false
}: RecordingSettingsProps) {
  const [status, setStatus] = useState("");
  const [hasAttemptedAutoselect, setHasAttemptedAutoselect] = useState(false);

  // Attempt to auto-select the first device if none is selected
  useEffect(() => {
    if (!selectedDeviceId && audioDevices.length > 0 && !hasAttemptedAutoselect && !isRecording) {
      console.log('Auto-selecting first device:', audioDevices[0].deviceId);
      onDeviceSelect(audioDevices[0].deviceId);
      setHasAttemptedAutoselect(true);
    }
  }, [audioDevices, selectedDeviceId, hasAttemptedAutoselect, onDeviceSelect, isRecording]);

  // Update status message based on current state
  useEffect(() => {
    let newStatus = "Status: Ready";
    let statusColor = "text-green-500";
    
    // Set status messages
    if (permissionState === 'denied') {
      newStatus = "Microphone permission denied";
      statusColor = "text-red-500";
    } else if (permissionState === 'prompt') {
      newStatus = "Microphone permission needed";
      statusColor = "text-amber-500";
    } else if (audioDevices.length === 0) {
      newStatus = "No microphones detected";
      statusColor = "text-amber-500";
    } else if (!selectedDeviceId) {
      newStatus = "Please select a microphone";
      statusColor = "text-amber-500";
    } else if (isRecording) {
      newStatus = "Status: Recording";
      statusColor = "text-red-500";
    } else if (!deviceSelectionReady) {
      newStatus = "Status: Preparing...";
      statusColor = "text-blue-500";
    }
    
    setStatus(newStatus);
    
    // Apply color to status element
    const statusElement = document.getElementById('recording-status');
    if (statusElement) {
      // Remove any existing color classes
      statusElement.classList.remove('text-red-500', 'text-amber-500', 'text-green-500', 'text-blue-500');
      // Add the new color class
      statusElement.classList.add(statusColor);
    }
    
  }, [audioDevices.length, deviceSelectionReady, isRecording, permissionState, selectedDeviceId]);

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    if (isRecording) return "destructive";
    if (permissionState === 'denied') return "destructive";
    if (permissionState === 'prompt' || audioDevices.length === 0 || !selectedDeviceId) return "secondary";
    if (deviceSelectionReady) return "default";
    return "secondary";
  };

  const handleDeviceChange = (deviceId: string) => {
    console.log('Device selected:', deviceId);
    onDeviceSelect(deviceId);
  };

  const handleRefresh = async () => {
    if (onRefreshDevices) {
      try {
        await onRefreshDevices();
      } catch (error) {
        console.error("Error refreshing devices:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p id="recording-status" className="font-medium">
            {status}
          </p>
          {audioDevices.length > 0 && (
            <p className="text-amber-500">
              {selectedDeviceId ? "" : "No microphones detected"}
            </p>
          )}
        </div>
        <Badge variant={getStatusBadgeVariant()}>
          {permissionState === 'denied' ? "Permission Denied" :
           isRecording ? "Recording" :
           !deviceSelectionReady ? "Not Ready" :
           "Ready"}
        </Badge>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Audio settings</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="device-select" className="text-sm">Select Microphone</Label>
            {onRefreshDevices && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRecording || devicesLoading || disabled}
                title="Refresh device list"
              >
                <RefreshCcw 
                  className={`h-4 w-4 ${devicesLoading ? 'animate-spin' : ''}`} 
                />
                {devicesLoading && <span className="ml-2 text-xs">Scanning...</span>}
                {!devicesLoading && audioDevices.length > 0 && 
                 <span className="ml-2 text-xs">{audioDevices.length} found</span>}
              </Button>
            )}
          </div>
          
          <Select
            value={selectedDeviceId || ""}
            onValueChange={handleDeviceChange}
            disabled={isRecording || audioDevices.length === 0 || disabled}
          >
            <SelectTrigger id="device-select" className="w-full">
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.length === 0 ? (
                <SelectItem value="none" disabled>
                  {permissionState === 'denied' 
                    ? "Permission denied" 
                    : devicesLoading 
                      ? "Scanning for devices..." 
                      : "No devices found"}
                </SelectItem>
              ) : (
                audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    <div className="flex items-center">
                      <Mic className="h-4 w-4 mr-2 text-gray-500" />
                      {device.displayName || device.label}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <p className="text-xs text-gray-500">
            Devices: {audioDevices.length}
            <span className="ml-4">
              Permission: {permissionState}
            </span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="system-audio"
            checked={isSystemAudio}
            onCheckedChange={onSystemAudioChange}
            disabled={isRecording || disabled}
          />
          <Label htmlFor="system-audio">Also record system audio (Chrome only)</Label>
        </div>
      </div>
    </div>
  );
}
