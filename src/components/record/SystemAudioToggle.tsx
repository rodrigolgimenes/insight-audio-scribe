
import { Switch } from "@/components/ui/switch";
import { Volume2 } from "lucide-react";

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
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Volume2 className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Include system audio</span>
      </div>
      <Switch 
        checked={isSystemAudio}
        onCheckedChange={onSystemAudioChange}
        disabled={disabled}
      />
    </div>
  );
}
