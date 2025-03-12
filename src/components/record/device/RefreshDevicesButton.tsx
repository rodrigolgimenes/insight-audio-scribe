
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RefreshDevicesButtonProps {
  onRefreshDevices?: () => void;
}

export function RefreshDevicesButton({ onRefreshDevices }: RefreshDevicesButtonProps) {
  if (!onRefreshDevices) return null;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onRefreshDevices} 
      className="h-7 px-2"
    >
      <RefreshCw className="h-3.5 w-3.5 mr-1" />
      <span className="text-xs">Refresh</span>
    </Button>
  );
}
