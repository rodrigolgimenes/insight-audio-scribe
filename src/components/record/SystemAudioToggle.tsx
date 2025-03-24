
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Laptop } from "lucide-react";

export interface SystemAudioToggleProps {
  isSystemAudio: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  onSystemAudioChange?: (enabled: boolean) => void; // Add this for backward compatibility
}

export function SystemAudioToggle({
  isSystemAudio,
  onChange,
  onSystemAudioChange, // Add this prop
  disabled = false,
}: SystemAudioToggleProps) {
  // Create a handler that calls both callbacks if they exist
  const handleChange = (value: boolean) => {
    onChange(value);
    if (onSystemAudioChange) {
      onSystemAudioChange(value);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Laptop className="h-4 w-4" />
        <label className="text-sm font-medium">
          Include system audio
        </label>
      </div>
      
      <Switch
        checked={isSystemAudio}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
