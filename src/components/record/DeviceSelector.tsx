
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceSelectorLabel } from "./DeviceSelectorLabel";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2 } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isReady?: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  suppressMessages?: boolean; // Add suppressMessages prop
}

export function DeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false,
  isReady = true,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  suppressMessages = false // Default to false for backward compatibility
}: DeviceSelectorProps) {
  // If suppressMessages is true, ensure we always have a device
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
  
  // Don't show any notifications when devices are empty if suppressMessages is true
  if (effectiveDevices.length === 0 && !suppressMessages) {
    return null; // Don't render anything if no devices and messages are suppressed
  }
  
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <DeviceSelectorLabel 
          permissionStatus={permissionState === 'unknown' ? null : permissionState} 
        />
        
        {onRefreshDevices && (
          <Button
            variant="ghost"
            size="sm"
            disabled={devicesLoading || disabled}
            onClick={onRefreshDevices}
            className="h-8 px-2"
          >
            {devicesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      <Select
        value={selectedDeviceId || undefined}
        onValueChange={onDeviceSelect}
        disabled={disabled || !isReady || devicesLoading || effectiveDevices.length === 0}
      >
        <SelectTrigger 
          className={`w-full ${!isReady || effectiveDevices.length === 0 ? 'opacity-70' : ''}`}
        >
          <SelectValue placeholder={
            devicesLoading 
              ? "Loading devices..." 
              : effectiveDevices.length === 0 
                ? "No microphones found" 
                : "Select a microphone"
          } />
        </SelectTrigger>
        <SelectContent>
          {effectiveDevices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.index + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
