
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RefreshDevicesButtonProps {
  onRefreshDevices?: () => void;
  isLoading?: boolean;
}

export function RefreshDevicesButton({
  onRefreshDevices,
  isLoading = false
}: RefreshDevicesButtonProps) {
  if (!onRefreshDevices) return null;
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onRefreshDevices}
      disabled={isLoading}
      className="h-7 w-7"
      title="Refresh microphone list"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
    </Button>
  );
}
