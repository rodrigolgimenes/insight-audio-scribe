
import React from "react";
import { Mic, Check, AlertCircle } from "lucide-react";

interface DeviceSelectorLabelProps {
  permissionStatus: PermissionState | null;
}

export function DeviceSelectorLabel({ permissionStatus }: DeviceSelectorLabelProps) {
  // Check if we're on a restricted route (dashboard, index, app)
  const isRestrictedRoute = React.useMemo((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  // Don't show status indicators on restricted routes
  if (isRestrictedRoute) {
    return (
      <div className="flex items-center">
        <label className="text-sm font-medium flex items-center gap-1">
          <Mic className="h-4 w-4" />
          Audio device
        </label>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium flex items-center gap-1">
        <Mic className="h-4 w-4" />
        Audio device
      </label>
      
      <div className="flex items-center">
        {permissionStatus === 'granted' ? (
          <div className="text-xs text-green-500 flex items-center">
            <Check className="h-3 w-3 mr-1" />
            Allowed
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="text-xs text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Blocked
          </div>
        ) : permissionStatus === 'prompt' ? (
          <div className="text-xs text-amber-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Waiting for permission
          </div>
        ) : null}
      </div>
    </div>
  );
}
