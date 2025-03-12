
import { logAudioTracks, validateAudioTracks } from '../recordingHelpers';

/**
 * Base class with shared utility methods for the recorder lifecycle
 */
export class BaseRecorderLifecycle {
  /**
   * Validates a media stream for recording
   */
  protected validateStream(stream: MediaStream): void {
    if (!stream) {
      throw new Error('No media stream provided');
    }
    
    // Validate stream before proceeding
    logAudioTracks(stream);
    validateAudioTracks(stream);
  }

  /**
   * Creates a standard log message
   */
  protected logAction(action: string, details: Record<string, any> = {}): void {
    console.log(`[RecorderLifecycle] ${action}`, details);
  }
  
  /**
   * Creates a standard error log
   */
  protected logError(action: string, error: Error): void {
    console.error(`[RecorderLifecycle] Error ${action}:`, error);
  }
}
