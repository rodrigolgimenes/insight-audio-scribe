
import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForceRefreshDevicesButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  showCount?: boolean;
  deviceCount?: number;
  permissionState?: string;
}

export function ForceRefreshDevicesButton({
  onRefresh,
  isLoading = false,
  showCount = true,
  deviceCount = 0,
  permissionState = 'unknown'
}: ForceRefreshDevicesButtonProps) {
  const handleRefresh = () => {
    console.log('[ForceRefreshDevicesButton] Force refreshing devices with state:', {
      deviceCount,
      permissionState,
      timestamp: new Date().toISOString()
    });
    
    onRefresh();
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      <span>Force Refresh Devices</span>
      {showCount && (
        <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded-full">
          {deviceCount}
        </span>
      )}
    </Button>
  );
}
