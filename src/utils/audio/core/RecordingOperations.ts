
import { MediaRecorderManager } from '../mediaRecorderManager';
import { DurationTracker } from '../helpers/durationTracker';
import { IRecorderState } from '../types/recorderStateTypes';
import { BaseRecorderLifecycle } from './BaseRecorderLifecycle';
import { RecordingResult } from '../types';

/**
 * Handles the core recording operations (start, stop, pause, resume)
 */
export class RecordingOperations extends BaseRecorderLifecycle {
  constructor(
    private mediaRecorderManager: MediaRecorderManager,
    private durationTracker: DurationTracker,
    private recorderState: IRecorderState
  ) {
    super();
  }

  /**
   * Starts the MediaRecorder
   */
  startMediaRecorder(stream: MediaStream): void {
    try {
      this.mediaRecorderManager.initialize(stream);
      this.durationTracker.startTracking();
      
      try {
        this.mediaRecorderManager.start();
      } catch (startError) {
        this.logError('starting MediaRecorder', startError);
        throw new Error(`Failed to start recording: ${startError.message}`);
      }
      
      // Update state
      this.recorderState.setIsRecording(true);
      this.recorderState.setIsPaused(false);
      this.recorderState.setIsInitialized(true);
      this.recorderState.setLatestBlob(null);
      this.recorderState.setRecordingStartTime(Date.now());
      
      this.logAction('Recording started successfully at', 
        { time: new Date(this.recorderState.getRecordingStartTime() || 0).toISOString() });
    } catch (error) {
      this.logError('starting media recorder', error);
      throw error;
    }
  }

  /**
   * Stops the MediaRecorder and finalizes the recording
   */
  async stopMediaRecorder(): Promise<RecordingResult> {
    const finalDuration = this.durationTracker.getCurrentDuration();
    
    this.mediaRecorderManager.stop();
    this.recorderState.setIsRecording(false);
    this.recorderState.setIsPaused(false);
    this.durationTracker.stopTracking();

    return new Promise((resolve) => {
      // Use a timeout to ensure all data is processed
      setTimeout(() => {
        const finalBlob = this.mediaRecorderManager.getFinalBlob();
        this.recorderState.setLatestBlob(finalBlob);
        
        this.logAction('Recording stopped', 
          this.mediaRecorderManager.getRecordingStats(finalDuration)
        );
        
        const result = {
          blob: finalBlob,
          stats: this.mediaRecorderManager.getRecordingStats(finalDuration),
          duration: finalDuration
        };
        
        resolve(result);
      }, 500); // Increased timeout to ensure all data is processed
    });
  }

  /**
   * Pauses the current recording
   */
  pauseMediaRecorder(): void {
    this.mediaRecorderManager.pause();
    this.durationTracker.pauseTracking();
    this.recorderState.setIsPaused(true);
    this.logAction('Recording paused at', { duration: this.durationTracker.getCurrentDuration() });
  }

  /**
   * Resumes a paused recording
   */
  resumeMediaRecorder(): void {
    this.mediaRecorderManager.resume();
    this.durationTracker.resumeTracking();
    this.recorderState.setIsPaused(false);
    this.logAction('Recording resumed at', { duration: this.durationTracker.getCurrentDuration() });
  }
}
