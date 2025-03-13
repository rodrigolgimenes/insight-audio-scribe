
import { useState, useEffect, useRef } from "react";

export function useDeviceAutoRefresh(
  deviceCount: number,
  devicesLoading: boolean, 
  onRefreshDevices?: () => void
) {
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const [lastDeviceCount, setLastDeviceCount] = useState(0);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const maxAutoRefreshes = 15; // Increased limit
  const forcedRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
      if (forcedRefreshTimeoutRef.current) {
        clearTimeout(forcedRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Track device count changes to help diagnose issues
  useEffect(() => {
    if (deviceCount !== lastDeviceCount) {
      console.log(`[DeviceSelector] Device count changed: ${lastDeviceCount} -> ${deviceCount}`);
      setLastDeviceCount(deviceCount);
      
      // Reset auto-refresh counter when we get devices
      if (deviceCount > 0) {
        setAutoRefreshCount(0);
        if (autoRefreshTimerRef.current) {
          clearTimeout(autoRefreshTimerRef.current);
          autoRefreshTimerRef.current = null;
        }
        if (forcedRefreshTimeoutRef.current) {
          clearTimeout(forcedRefreshTimeoutRef.current);
          forcedRefreshTimeoutRef.current = null;
        }
      }
    }
  }, [deviceCount, lastDeviceCount]);

  // Attempt periodic refreshes when no devices are found, with more aggressive strategy
  useEffect(() => {
    const attemptDeviceRefresh = () => {
      if (isMounted.current && deviceCount === 0 && onRefreshDevices) {
        console.log(`[DeviceSelector] Auto-refreshing devices (attempt #${autoRefreshCount + 1})`);
        
        onRefreshDevices();
        setAutoRefreshCount(prev => prev + 1);
      }
    };
    
    if (deviceCount === 0 && !devicesLoading && onRefreshDevices && autoRefreshCount < maxAutoRefreshes) {
      // Clear any existing timer
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
      
      // Implement a more aggressive refresh strategy with shorter initial delays
      // Use very short initial delays, then progressively longer ones
      let delay: number;
      
      if (autoRefreshCount < 3) {
        // Very aggressive for first few attempts (500ms, 700ms, 900ms)
        delay = 500 + (autoRefreshCount * 200);
      } else if (autoRefreshCount < 7) {
        // Medium delays for next few attempts
        delay = 1000 + (autoRefreshCount * 300);
      } else {
        // Longer delays for later attempts
        delay = Math.min(2000 + (autoRefreshCount * 500), 10000);
      }
      
      console.log(`[DeviceSelector] Setting auto-refresh timer #${autoRefreshCount + 1} for ${delay}ms`);
      
      autoRefreshTimerRef.current = setTimeout(attemptDeviceRefresh, delay);
      
      // If we have had multiple retries without success, try a complete different approach
      // by forcing the browser to request permissions again
      if (autoRefreshCount === 5) {
        console.log('[DeviceSelector] Setting up forced permission request after delays');
        forcedRefreshTimeoutRef.current = setTimeout(() => {
          if (isMounted.current && deviceCount === 0) {
            console.log('[DeviceSelector] Trying forced permission approach');
            // Force a permission prompt with a different constraint set
            navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            }).then(stream => {
              console.log('[DeviceSelector] Got stream from forced approach, stopping tracks');
              stream.getTracks().forEach(track => track.stop());
              
              // Wait a moment and refresh devices
              setTimeout(() => {
                if (isMounted.current && onRefreshDevices) {
                  console.log('[DeviceSelector] Refreshing after forced approach');
                  onRefreshDevices();
                }
              }, 500);
            }).catch(err => {
              console.error('[DeviceSelector] Forced approach failed:', err);
            });
          }
        }, 4000);
      }
    }
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
    };
  }, [deviceCount, devicesLoading, onRefreshDevices, autoRefreshCount, maxAutoRefreshes]);

  return {
    autoRefreshCount
  };
}
