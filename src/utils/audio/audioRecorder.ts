
// Re-export from the new location to maintain backward compatibility
import { BaseRecorder } from './core/BaseRecorder';

// Legacy exports for backward compatibility
export { BaseRecorder as AudioRecorder };

// Export types for use in other files
export type { RecordingResult, RecordingStats } from './types';
