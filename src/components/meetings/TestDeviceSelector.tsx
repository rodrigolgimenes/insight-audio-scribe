
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface TestDeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isLoading?: boolean;
  label?: string;
}

export function TestDeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading = false,
  label = "Audio Device"
}: TestDeviceSelectorProps) {
  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      <Select value={selectedDeviceId || ""} onValueChange={onDeviceSelect}>
        <SelectTrigger className="w-full bg-white border-gray-300">
          <SelectValue placeholder="Select a microphone" />
        </SelectTrigger>
        <SelectContent>
          {audioDevices.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              No microphones found
            </SelectItem>
          ) : (
            audioDevices.map((device, index) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
