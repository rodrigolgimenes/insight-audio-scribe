
import React from "react";
import { FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LongRecordingBadgeProps {
  durationInMinutes: number;
}

export const LongRecordingBadge: React.FC<LongRecordingBadgeProps> = ({ durationInMinutes }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
            <FileWarning className="h-3 w-3 mr-1" />
            Long recording
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            This is a long recording ({durationInMinutes} minutes). 
            Processing may take considerably longer than usual.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
