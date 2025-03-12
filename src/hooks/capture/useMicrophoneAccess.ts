
// Import directly from the recording directory to maintain consistency
import { useMicrophoneAccess as useRecordingMicrophoneAccess } from "../recording/capture/useMicrophoneAccess";

// Re-export the hook for backward compatibility
export const useMicrophoneAccess = useRecordingMicrophoneAccess;
