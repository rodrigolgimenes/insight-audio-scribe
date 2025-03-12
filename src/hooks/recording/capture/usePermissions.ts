
import { usePermissionMonitor } from "./permissions/permissionMonitor";
import { usePermissionCheck } from "./permissions/permissionCheck";

/**
 * Hook to check and request microphone permissions
 */
export const usePermissions = () => {
  // Monitor permission status
  const { permissionStatus, setPermissionStatus } = usePermissionMonitor();
  
  // Set up permission checking
  const { checkPermissions } = usePermissionCheck(permissionStatus, setPermissionStatus);

  return {
    permissionStatus,
    checkPermissions
  };
};
