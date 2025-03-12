
export interface AudioDevice extends MediaDeviceInfo {
  isDefault?: boolean;
  displayName?: string; // Added for better UX display options
}
