
/**
 * Types related to permission handling
 */

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionCheckOptions {
  showToast?: boolean;
  retry?: boolean;
  maxRetries?: number;
}

export interface PermissionResult {
  permissionState: PermissionState;
  checkPermissions: () => Promise<boolean>;
}

