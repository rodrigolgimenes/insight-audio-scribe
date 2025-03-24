
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface SystemAudioToggleProps {
  isSystemAudio: boolean;
  onChange: (enabled: boolean) => void;
  onSystemAudioChange?: (enabled: boolean) => void; // Make this optional for backward compatibility
  disabled?: boolean;
}

export function SystemAudioToggle({
  isSystemAudio,
  onChange,
  onSystemAudioChange,
  disabled = false,
}: SystemAudioToggleProps) {
  // Use a handler that calls both callbacks for backward compatibility
  const handleChange = (value: boolean) => {
    onChange(value);
    if (onSystemAudioChange) onSystemAudioChange(value);
  };

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="system-audio" className="text-sm font-medium">
        Record system audio
      </Label>
      <Switch
        id="system-audio"
        checked={isSystemAudio}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
