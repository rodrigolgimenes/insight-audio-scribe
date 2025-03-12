
// Import directly from the recording directory to maintain consistency
import { useDeviceEnumeration as useRecordingDeviceEnumeration } from "../recording/capture/useDeviceEnumeration";

// Re-export the hook for backward compatibility
export const useDeviceEnumeration = useRecordingDeviceEnumeration;
