
// Import directly from the recording directory to maintain consistency
import { usePermissions as useRecordingPermissions } from "../recording/capture/usePermissions";

// Re-export the hook for backward compatibility
export const usePermissions = useRecordingPermissions;
