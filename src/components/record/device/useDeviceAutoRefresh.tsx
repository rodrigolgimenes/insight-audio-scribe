
import { useState, useEffect, useRef } from "react";

export function useDeviceAutoRefresh(
  deviceCount: number,
  devicesLoading: boolean, 
  onRefreshDevices?: () => void
) {
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const isMounted = useRef(true);
  const maxAutoRefreshes = 3; // Reduced number of auto-refreshes
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
    };
  }, []);

  // Attempt a few refreshes when no devices are found, using a more efficient approach
  useEffect(() => {
    // Reset auto-refresh counter when we get devices
    if (deviceCount > 0 && autoRefreshTimerRef.current) {
      console.log(`[DeviceAutoRefresh] Devices found, clearing refresh timer`);
      clearTimeout(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
      return;
    }
    
    const attemptDeviceRefresh = () => {
      if (isMounted.current && deviceCount === 0 && onRefreshDevices && autoRefreshCount < maxAutoRefreshes) {
        console.log(`[DeviceAutoRefresh] Auto-refreshing devices (attempt #${autoRefreshCount + 1})`);
        onRefreshDevices();
        setAutoRefreshCount(prev => prev + 1);
      }
    };
    
    // Start a refresh cycle only if needed
    if (deviceCount === 0 && !devicesLoading && onRefreshDevices && autoRefreshCount < maxAutoRefreshes) {
      // Clear any existing timer
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
      
      // Use exponential backoff for retries (1s, 2s, 4s)
      const delay = 1000 * Math.pow(2, autoRefreshCount);
      
      console.log(`[DeviceAutoRefresh] Setting auto-refresh timer #${autoRefreshCount + 1} for ${delay}ms`);
      autoRefreshTimerRef.current = setTimeout(attemptDeviceRefresh, delay);
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
