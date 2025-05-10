
import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DevicePermissionError() {
  const handleOpenSettings = () => {
    // This only works on Chrome and Edge
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permissionStatus => {
          if (permissionStatus.state === 'denied') {
            // Attempt to open browser settings
            window.open('chrome://settings/content/microphone');
          }
        })
        .catch(error => {
          console.error('Error checking permissions:', error);
        });
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Microphone access denied</AlertTitle>
      <AlertDescription className="flex flex-col space-y-4">
        <p>
          You've denied access to your microphone. To use the recording feature, 
          please allow microphone access in your browser settings.
        </p>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenSettings}
          >
            Open Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
