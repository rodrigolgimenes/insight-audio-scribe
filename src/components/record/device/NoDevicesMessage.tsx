
import React from "react";
import { RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  audioDevices: AudioDevice[];
  isLoading?: boolean;
}

export function NoDevicesMessage({
  showWarning,
  onRefresh,
  permissionState = 'unknown',
  audioDevices = [],
  isLoading = false
}: NoDevicesMessageProps) {
  if (!showWarning) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <HelpCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <div>
          <p className="font-medium">No microphones detected</p>
          <p className="text-sm">
            {permissionState === 'granted' 
              ? "We have permission to access your microphone, but no devices were found." 
              : "Check if your microphone is properly connected and permissions are granted."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full flex items-center justify-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Scanning..." : "Scan for microphones"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
