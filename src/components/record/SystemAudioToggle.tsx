
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume2 } from "lucide-react";

export interface SystemAudioToggleProps {
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
    <div className="flex items-center space-x-2 p-2 rounded border border-gray-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
      <Volume2 className="h-5 w-5 text-blue-500" />
      <Label htmlFor="system-audio" className="flex-1">
        Record system audio (includes sound from your computer)
      </Label>
      <Switch
        id="system-audio"
        checked={isSystemAudio}
        onCheckedChange={onSystemAudioChange}
        disabled={disabled}
      />
    </div>
  );
}
