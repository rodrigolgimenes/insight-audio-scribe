
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface TestDeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  onRefreshDevices?: () => void;
  isLoading?: boolean;
}

export function TestDeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  onRefreshDevices,
  isLoading = false
}: TestDeviceSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Dispositivo de Áudio</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshDevices}
          disabled={isLoading}
          className="h-8"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Select value={selectedDeviceId || ""} onValueChange={onDeviceSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Nenhum dispositivo encontrado" />
        </SelectTrigger>
        <SelectContent>
          {audioDevices.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              Nenhum microfone encontrado
            </SelectItem>
          ) : (
            audioDevices.map((device, index) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microfone ${index + 1}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
