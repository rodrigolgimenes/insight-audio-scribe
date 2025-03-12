
// Main entry point for audio recording functionality
import { AudioRecorderImpl } from './AudioRecorderImpl';

// Export the implementation class as AudioRecorder
export class AudioRecorder extends AudioRecorderImpl {}

// Export related types for use in other files
export type { 
  RecordingResult, 
  RecordingStats, 
  RecordingObserver, 
  RecordingEvent 
} from './types/audioRecorderTypes';
