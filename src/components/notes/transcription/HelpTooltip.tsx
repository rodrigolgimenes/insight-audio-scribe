
import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const HelpTooltip: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4">
          <p className="font-medium mb-2">Common Error Solutions:</p>
          <ul className="list-disc ml-4 space-y-1 text-sm">
            <li>Try using a different browser (Chrome recommended)</li>
            <li>Convert your audio to MP3 format before uploading</li>
            <li>Make sure your audio file is not corrupted</li>
            <li>Ensure your recording is less than 25MB in size</li>
            <li>Check your internet connection and try again</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
