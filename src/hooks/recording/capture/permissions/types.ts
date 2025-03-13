
/**
 * Valid permission states including "unknown" state
 */
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

/**
 * Options for permission check function
 */
export interface PermissionCheckOptions {
  showToast?: boolean;
  retry?: boolean;
  maxRetries?: number;
}
