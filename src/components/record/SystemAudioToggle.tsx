
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Laptop } from "lucide-react";

export interface SystemAudioToggleProps {
  isSystemAudio: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SystemAudioToggle({
  isSystemAudio,
  onChange,
  disabled = false,
}: SystemAudioToggleProps) {
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
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
