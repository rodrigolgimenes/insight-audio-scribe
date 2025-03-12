
// Re-export from the newer implementation to maintain backward compatibility
import { AudioRecorder } from './AudioRecorder';

// Export the main class
export { AudioRecorder };

// Export related types for use in other files
export type { RecordingResult, RecordingStats, RecordingObserver, RecordingEvent } from './types/audioRecorderTypes';
