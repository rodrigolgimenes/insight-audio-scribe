
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SystemAudioToggleProps {
  isSystemAudio: boolean;
  onSystemAudioChange: (isSystemAudio: boolean) => void;
  disabled?: boolean;
}

export function SystemAudioToggle({ isSystemAudio, onSystemAudioChange, disabled = false }: SystemAudioToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (checked: boolean) => {
    onSystemAudioChange(checked);
  };

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="system-audio" className="flex items-center cursor-pointer">
          <span>Include system audio</span>
          <TooltipProvider>
            <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 ml-1.5 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Record audio from your browser tabs, applications, or entire system along with your microphone.</p>
                <p className="text-xs mt-1 text-gray-500">You'll be prompted to choose what to share when recording starts.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      <Switch
        id="system-audio"
        checked={isSystemAudio}
        onCheckedChange={handleToggle}
        disabled={disabled}
      />
    </div>
  );
}
