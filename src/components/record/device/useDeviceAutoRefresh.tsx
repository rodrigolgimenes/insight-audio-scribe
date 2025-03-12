
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
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
      }
    }
  }, [deviceCount, lastDeviceCount]);

  // Attempt periodic refreshes when no devices are found
  useEffect(() => {
    if (deviceCount === 0 && !devicesLoading && onRefreshDevices && autoRefreshCount < 5) {
      // Clear any existing timer
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
      
      // Set a new auto-refresh timer
      const delay = Math.min(2000 * (autoRefreshCount + 1), 8000);
      console.log(`[DeviceSelector] Setting auto-refresh timer #${autoRefreshCount + 1} for ${delay}ms`);
      
      autoRefreshTimerRef.current = setTimeout(() => {
        if (isMounted.current && deviceCount === 0 && onRefreshDevices) {
          console.log(`[DeviceSelector] Auto-refreshing devices (attempt #${autoRefreshCount + 1})`);
          onRefreshDevices();
          setAutoRefreshCount(prev => prev + 1);
        }
      }, delay);
    }
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
    };
  }, [deviceCount, devicesLoading, onRefreshDevices, autoRefreshCount]);

  return {
    autoRefreshCount
  };
}
