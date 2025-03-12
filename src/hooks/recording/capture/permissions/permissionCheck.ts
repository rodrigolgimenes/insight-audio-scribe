
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { PermissionState, PermissionCheckOptions } from "./types";
import { requestMicrophonePermission, cleanupMediaStream, showPermissionErrorToast } from "./permissionUtils";

/**
 * Core permission check logic
 */
export const usePermissionCheck = (
  permissionStatus: PermissionState,
  setPermissionStatus: (status: PermissionState) => void
) => {
  const permissionCheckInProgressRef = useRef(false);
  const retryCountRef = useRef(0);

  // Function to check if we have microphone permission
  const checkPermissions = useCallback(async (
    options: PermissionCheckOptions = {}
  ): Promise<boolean> => {
    const { showToast = true, retry = true, maxRetries = 2 } = options;
    
    // Prevent multiple simultaneous permission checks
    if (permissionCheckInProgressRef.current) {
      console.log('[usePermissionCheck] Permission check already in progress');
      return permissionStatus === 'granted';
    }
    
    permissionCheckInProgressRef.current = true;
    console.log('[usePermissionCheck] Checking microphone permissions');
    
    try {
      // First try the Permissions API if available
      if (navigator.permissions) {
        try {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('[usePermissionCheck] Permission status:', permissionResult.state);
          
          setPermissionStatus(permissionResult.state as PermissionState);
          
          if (permissionResult.state === 'granted') {
            permissionCheckInProgressRef.current = false;
            return true;
          }
          
          // Use triple equals when comparing string literals to ensure type safety
          if (permissionResult.state === 'denied') {
            if (showToast) {
              toast.error("Microphone access denied", {
                description: "Please allow microphone access in your browser settings"
              });
            }
            permissionCheckInProgressRef.current = false;
            return false;
          }
        } catch (err) {
          console.warn('[usePermissionCheck] Error checking permissions:', err);
        }
      }

      // Try to request permission directly through getUserMedia
      try {
        const stream = await requestMicrophonePermission();
        if (stream) {
          setPermissionStatus('granted');
          cleanupMediaStream(stream);
          permissionCheckInProgressRef.current = false;
          return true;
        }
      } catch (error) {
        console.error('[usePermissionCheck] Error requesting permission:', error);
        
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            setPermissionStatus('denied');
            if (showToast) {
              showPermissionErrorToast(error);
            }
          } else if (error.name === 'NotFoundError') {
            if (showToast) {
              toast.error("No microphone found", {
                description: "Please connect a microphone and try again"
              });
            }
          }
        }
        
        // If retries are enabled and we haven't exceeded max retries
        if (retry && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          permissionCheckInProgressRef.current = false;
          return checkPermissions(options);
        }
        
        setPermissionStatus('denied');
        permissionCheckInProgressRef.current = false;
        return false;
      }
      
      // If we get here without a clear result, assume we need prompt
      setPermissionStatus('prompt');
      permissionCheckInProgressRef.current = false;
      return false;
    } catch (error) {
      console.error('[usePermissionCheck] Unexpected error:', error);
      setPermissionStatus('unknown');
      permissionCheckInProgressRef.current = false;
      return false;
    }
  }, [permissionStatus, setPermissionStatus]);

  return { checkPermissions };
};
