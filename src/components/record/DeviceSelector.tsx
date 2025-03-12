
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
  // Auto-select first device when devices are loaded if none is selected
  useEffect(() => {
    if (hasDevices && !selectedDeviceId && audioDevices.length > 0) {
      console.log('[DeviceSelector] Auto-selecting first device:', audioDevices[0].deviceId);
      onDeviceSelect(audioDevices[0].deviceId);
    }
  }, [audioDevices, hasDevices, selectedDeviceId, onDeviceSelect]);

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="audio-device" className="text-sm text-gray-700">
          Select Microphone *
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
        onValueChange={onDeviceSelect}
        disabled={disabled || !hasDevices}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a microphone" />
        </SelectTrigger>
        <SelectContent>
          {audioDevices.map((device, index) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
