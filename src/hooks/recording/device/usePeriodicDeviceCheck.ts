
import { useEffect, useRef } from "react";

export const usePeriodicDeviceCheck = (
  deviceCount: number,
  detectDevices: (forceRefresh: boolean) => Promise<any>
) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    // Fallback detection for older browsers
    const checkForReconnectedDevices = () => {
      if (deviceCount === 0 && mountedRef.current) {
        console.log('[usePeriodicDeviceCheck] Performing periodic device check');
        detectDevices(true);
      }
    };
    
    // Check periodically for reconnected devices
    const periodicCheckInterval = setInterval(checkForReconnectedDevices, 10000);
    
    return () => {
      mountedRef.current = false;
      clearInterval(periodicCheckInterval);
    };
  }, [deviceCount, detectDevices]);
};
