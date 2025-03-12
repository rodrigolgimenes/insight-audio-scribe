
import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SystemAudioToggleProps {
  isSystemAudio: boolean;
  onSystemAudioChange: (enabled: boolean) => void;
  disabled: boolean;
}

export function SystemAudioToggle({
  isSystemAudio,
  onSystemAudioChange,
  disabled
}: SystemAudioToggleProps) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="system-audio" className="text-sm text-gray-700">
          If you are using a headset, enable this option
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Enable this option if you're using a headset to capture system audio (like meeting audio).
                You'll need to grant additional permission when prompted.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Switch
        id="system-audio"
        checked={isSystemAudio}
        onCheckedChange={onSystemAudioChange}
        disabled={disabled}
      />
    </div>
  );
}
