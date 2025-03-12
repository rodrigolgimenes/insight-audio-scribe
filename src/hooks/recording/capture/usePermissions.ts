
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export const usePermissions = () => {
  const { toast } = useToast();
  const [permissionGranted, setPermissionGranted] = useState(false);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[usePermissions] Checking microphone permissions');
      
      // Request permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'granted') {
        console.log('[usePermissions] Microphone permission already granted');
        setPermissionGranted(true);
        return true;
      }
      
      if (permissionStatus.state === 'prompt') {
        console.log('[usePermissions] Permission prompt will be shown');
        // We need to explicitly request the permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // If we got this far, permission was granted
        stream.getTracks().forEach(track => track.stop()); // Clean up
        setPermissionGranted(true);
        console.log('[usePermissions] Permission granted after prompt');
        return true;
      }
      
      if (permissionStatus.state === 'denied') {
        console.error('[usePermissions] Microphone permission denied');
        toast({
          title: "Error",
          description: "Microphone access denied. Please enable microphone permissions in your browser settings.",
          variant: "destructive",
        });
        setPermissionGranted(false);
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('[usePermissions] Error checking permissions:', error);
      toast({
        title: "Error",
        description: "Failed to check microphone permissions.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    permissionGranted,
    setPermissionGranted,
    checkPermissions
  };
};
