
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InfoCircle } from "lucide-react";

interface SystemAudioToggleProps {
  isSystemAudio: boolean;
  onSystemAudioChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function SystemAudioToggle({
  isSystemAudio,
  onSystemAudioChange,
  disabled = false
}: SystemAudioToggleProps) {
  return (
    <div className="w-full">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label 
            htmlFor="system-audio"
            className="text-sm font-medium text-gray-700 flex items-center"
          >
            Record System Audio
            <InfoCircle className="h-4 w-4 ml-1 text-gray-400" />
          </Label>
          <Switch
            id="system-audio"
            checked={isSystemAudio}
            onCheckedChange={onSystemAudioChange}
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-gray-500">
          When enabled, audio from your browser tabs will be recorded along with your microphone
        </p>
      </div>
    </div>
  );
}
