
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 inline-flex cursor-help">
                    <Info className="h-4 w-4 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  When enabled, audio from your browser tabs will be recorded along with your microphone
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Switch
            id="system-audio"
            checked={isSystemAudio}
            onCheckedChange={onSystemAudioChange}
            disabled={disabled}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        <p className="text-xs text-gray-500">
          When enabled, audio from your browser tabs will be recorded along with your microphone
        </p>
      </div>
    </div>
  );
}
