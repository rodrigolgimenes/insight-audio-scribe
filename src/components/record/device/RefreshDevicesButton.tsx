
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
      size="sm" 
      onClick={onRefreshDevices} 
      className="h-7 px-2"
      disabled={isLoading}
    >
      <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
      <span className="text-xs">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
    </Button>
  );
}
