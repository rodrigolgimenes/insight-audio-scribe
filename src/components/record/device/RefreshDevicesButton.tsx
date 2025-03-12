
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RefreshDevicesButtonProps {
  onRefreshDevices?: () => void;
  isLoading?: boolean;
  deviceCount?: number;
}

export function RefreshDevicesButton({
  onRefreshDevices,
  isLoading = false,
  deviceCount = 0
}: RefreshDevicesButtonProps) {
  if (!onRefreshDevices) return null;
  
  // Use success variant when devices are found
  const hasDevices = deviceCount > 0;
  
  return (
    <Button 
      variant={hasDevices ? "outline" : "ghost"} 
      size="icon" 
      onClick={onRefreshDevices}
      disabled={isLoading}
      className={`h-7 w-7 ${hasDevices ? 'border-green-500 bg-green-50 hover:bg-green-100' : ''}`}
      title={hasDevices ? `${deviceCount} microphone(s) found` : "Refresh microphone list"}
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${hasDevices ? 'text-green-600' : ''}`} />
    </Button>
  );
}
