
export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceInfo['kind'];
  isDefault?: boolean;
  displayName?: string; // Added for better UX display options
}
