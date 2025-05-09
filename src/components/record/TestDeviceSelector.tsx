
import React from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic } from "lucide-react";

interface TestDeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export const TestDeviceSelector = ({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading = false,
  permissionState = 'unknown'
}: TestDeviceSelectorProps) => {
  return (
    <Select
      value={selectedDeviceId || ""}
      onValueChange={onDeviceSelect}
      disabled={isLoading || permissionState === 'denied'}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a microphone">
          {selectedDeviceId ? 
            audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || "Unknown Device" : 
            "Select a microphone"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {audioDevices.map((device) => (
          <SelectItem key={device.deviceId} value={device.deviceId}>
            <div className="flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              {device.label || `Microphone ${device.index + 1}`}
            </div>
          </SelectItem>
        ))}
        {audioDevices.length === 0 && (
          <div className="p-2 text-xs text-gray-500">No devices found</div>
        )}
      </SelectContent>
    </Select>
  );
};
