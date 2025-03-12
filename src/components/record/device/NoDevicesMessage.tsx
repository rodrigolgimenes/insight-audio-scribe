
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
}

export function NoDevicesMessage({ showWarning, onRefresh }: NoDevicesMessageProps) {
  if (!showWarning) return null;
  
  return (
    <div className="flex items-start gap-1.5 mt-2 text-amber-500">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="text-xs space-y-1.5">
        <p className="font-medium">No microphones detected</p>
        <ul className="list-disc pl-4 text-amber-600/90 space-y-1">
          <li>Check if your microphone is connected properly</li>
          <li>Make sure your microphone isn't disabled in system settings</li>
          <li>Try unplugging and reconnecting your device</li>
          <li>Some browsers require a page refresh after connecting a device</li>
        </ul>
        
        <div className="flex gap-2 mt-2">
          {onRefresh && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs px-2 py-1 bg-white"
              onClick={onRefresh}
            >
              Retry Detection
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs px-2 py-1 bg-white"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
