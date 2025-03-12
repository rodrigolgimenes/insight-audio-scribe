
import { useEffect, useRef } from 'react';

/**
 * Hook to automatically refresh device list when there are no devices
 */
export function useDeviceAutoRefresh(
  deviceCount: number,
  isLoading: boolean,
  onRefreshDevices?: () => void
) {
  const hasAttemptedAutoRefresh = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Auto-refresh when no devices are found
    if (deviceCount === 0 && !isLoading && onRefreshDevices && !hasAttemptedAutoRefresh.current) {
      console.log('[useDeviceAutoRefresh] No devices found, scheduling auto-refresh');
      
      // Set a timeout to avoid continuous refreshing
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('[useDeviceAutoRefresh] Executing auto-refresh');
        hasAttemptedAutoRefresh.current = true;
        onRefreshDevices();
      }, 1000);
    }
    
    // If devices are found after a refresh, reset the flag so we can auto-refresh again if needed later
    if (deviceCount > 0 && hasAttemptedAutoRefresh.current) {
      console.log('[useDeviceAutoRefresh] Devices found, resetting auto-refresh flag');
      // Wait a bit before allowing another auto-refresh
      setTimeout(() => {
        hasAttemptedAutoRefresh.current = false;
      }, 5000);
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [deviceCount, isLoading, onRefreshDevices]);
}
