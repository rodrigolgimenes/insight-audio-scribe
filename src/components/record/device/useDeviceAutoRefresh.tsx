
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function useDeviceAutoRefresh(
  deviceCount: number,
  devicesLoading: boolean, 
  onRefreshDevices?: () => void
) {
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const [lastDeviceCount, setLastDeviceCount] = useState(0);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const maxAutoRefreshes = 10; // Increased limit

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

  // Attempt periodic refreshes when no devices are found, with more aggressive strategy
  useEffect(() => {
    if (deviceCount === 0 && !devicesLoading && onRefreshDevices && autoRefreshCount < maxAutoRefreshes) {
      // Clear any existing timer
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
      
      // Implement a more aggressive refresh strategy with shorter initial delays
      const initialDelay = 800; // Start with shorter delay
      const multiplier = autoRefreshCount < 3 ? 1.2 : 1.5; // Slower growth after initial attempts
      const delay = Math.min(initialDelay * Math.pow(multiplier, autoRefreshCount), 8000);
      
      console.log(`[DeviceSelector] Setting auto-refresh timer #${autoRefreshCount + 1} for ${delay}ms`);
      
      autoRefreshTimerRef.current = setTimeout(() => {
        if (isMounted.current && deviceCount === 0 && onRefreshDevices) {
          console.log(`[DeviceSelector] Auto-refreshing devices (attempt #${autoRefreshCount + 1})`);
          
          // Only show toast on certain attempts
          if (autoRefreshCount === 3) {
            toast.info("Still looking for microphones...", {
              id: "still-refreshing-devices",
              duration: 2000
            });
          }
          
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
  }, [deviceCount, devicesLoading, onRefreshDevices, autoRefreshCount, maxAutoRefreshes]);

  return {
    autoRefreshCount
  };
}
