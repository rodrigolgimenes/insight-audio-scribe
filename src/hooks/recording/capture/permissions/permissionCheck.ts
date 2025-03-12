
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
      // If we already know permission is granted, return that
      if (permissionStatus === 'granted') {
        return true;
      }
      // Wait for ongoing check
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(permissionStatus === 'granted');
        }, 1000);
      });
    }
    
    permissionCheckInProgressRef.current = true;
    console.log('[usePermissionCheck] Checking microphone permissions');
    
    try {
      // First try the Permissions API if available
      if (navigator.permissions) {
        try {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('[usePermissionCheck] Permission status:', permissionResult.state);
          
          if (permissionResult.state === 'granted') {
            console.log('[usePermissionCheck] Microphone permission already granted');
            setPermissionStatus('granted');
            permissionCheckInProgressRef.current = false;
            return true;
          } else if (permissionResult.state === 'denied') {
            console.warn('[usePermissionCheck] Microphone permission denied');
            setPermissionStatus('denied');
            if (showToast) {
              toast.error("Microphone access denied", {
                description: "Please allow microphone access in your browser settings"
              });
            }
            permissionCheckInProgressRef.current = false;
            return false;
          }
          // If status is prompt, we'll fall through to request permission
          setPermissionStatus('prompt');
        } catch (err) {
          console.warn('[usePermissionCheck] Error checking permissions:', err);
          // Fall through to getUserMedia approach
        }
      }
      
      // Try to get a stream as a way to request permissions
      console.log('[usePermissionCheck] Requesting temporary stream to check permissions');
      
      try {
        const stream = await requestMicrophonePermission();
        
        // If we get here, permission was granted
        console.log('[usePermissionCheck] Successfully got microphone access');
        
        // Clean up stream
        cleanupMediaStream(stream);
        
        // Update status
        setPermissionStatus('granted');
        
        // Reset retry counter on success
        retryCountRef.current = 0;
        
        // Show success toast (only on initial grant)
        if (permissionStatus !== 'granted' && showToast) {
          toast.success("Microphone access granted");
        }
        
        permissionCheckInProgressRef.current = false;
        return true;
      } catch (error) {
        console.error('[usePermissionCheck] Error requesting microphone permission:', error);
        
        // Update permission status based on error
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            setPermissionStatus('denied');
          }
        }
        
        // Decide if we should retry
        if (retry && retryCountRef.current < maxRetries && 
            !(error instanceof DOMException && error.name === 'NotAllowedError')) {
          console.log(`[usePermissionCheck] Scheduling retry (attempt ${retryCountRef.current + 1})`);
          retryCountRef.current++;
          
          permissionCheckInProgressRef.current = false;
          
          // Wait a bit and try again with a simpler request
          return new Promise(resolve => {
            setTimeout(async () => {
              try {
                // Simpler request for the retry
                const retryStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                cleanupMediaStream(retryStream);
                setPermissionStatus('granted');
                resolve(true);
              } catch (retryError) {
                console.error('[usePermissionCheck] Retry also failed:', retryError);
                
                if (showToast) {
                  showPermissionErrorToast(retryError);
                }
                
                if (retryError instanceof DOMException && retryError.name === 'NotAllowedError') {
                  setPermissionStatus('denied');
                }
                
                resolve(false);
              }
            }, 1500);
          });
        }
        
        // Show error toast if requested
        if (showToast) {
          showPermissionErrorToast(error);
        }
        
        permissionCheckInProgressRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('[usePermissionCheck] Unexpected error during permission check:', error);
      
      if (showToast) {
        toast.error("Unexpected error", {
          description: error instanceof Error ? error.message : "Unknown error checking permissions"
        });
      }
      
      permissionCheckInProgressRef.current = false;
      return false;
    }
  }, [permissionStatus, setPermissionStatus]);

  return { checkPermissions };
};
