
import { usePermissionMonitor } from "./permissions/permissionMonitor";
import { usePermissionCheck } from "./permissions/permissionCheck";
import { useCallback } from "react";

/**
 * Hook to check and request microphone permissions
 */
export const usePermissions = () => {
  // Check if we're on a restricted route (dashboard, index, app)
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  // Monitor permission status
  const { permissionStatus, setPermissionStatus } = usePermissionMonitor();
  
  // Set up permission checking
  const { checkPermissions } = usePermissionCheck(permissionStatus, setPermissionStatus);

  return {
    permissionStatus,
    checkPermissions,
    isRestrictedRoute
  };
};
