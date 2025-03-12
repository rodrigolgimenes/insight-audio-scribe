
import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";
import { useEffect } from "react";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled: boolean;
  hasDevices: boolean;
}

export function DeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  disabled,
  hasDevices
}: DeviceSelectorProps) {
  // Log relevant state for debugging
  useEffect(() => {
    console.log('[DeviceSelector] State updated:', { 
      devicesCount: audioDevices.length,
      deviceIds: audioDevices.map(d => d.deviceId),
      selectedDeviceId,
      disabled,
      hasDevices
    });
  }, [audioDevices, selectedDeviceId, disabled, hasDevices]);

  const handleDeviceChange = (deviceId: string) => {
    console.log('[DeviceSelector] Device selected:', deviceId);
    onDeviceSelect(deviceId);
  };

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="audio-device" className="text-sm text-gray-700">
          Select a Microphone *
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Please select a microphone before starting the recording.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select
        value={selectedDeviceId || undefined}
        onValueChange={handleDeviceChange}
        disabled={disabled || !hasDevices}
      >
        <SelectTrigger className="w-[280px] bg-white border-gray-300">
          <SelectValue placeholder="Select a microphone" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {audioDevices.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              No microphones found
            </SelectItem>
          ) : (
            audioDevices.map((device, index) => (
              <SelectItem key={device.deviceId || `device-${index}`} value={device.deviceId || ''}>
                {device.label || `Microphone ${index + 1}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
