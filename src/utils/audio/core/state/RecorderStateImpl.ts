
import { IRecorderState, RecorderStateProperties } from '../../types/recorderStateTypes';

/**
 * Implementation of the recorder state
 */
export class RecorderStateImpl implements IRecorderState {
  private isRecording = false;
  private isPaused = false;
  private isInitialized = false;
  private hasInitError = false;
  private latestBlob: Blob | null = null;
  private recordingStartTime: number | null = null;

  /**
   * Sets the recording state
   */
  setIsRecording(isRecording: boolean): void {
    this.isRecording = isRecording;
  }

  /**
   * Gets the recording state
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Sets the paused state
   */
  setIsPaused(isPaused: boolean): void {
    this.isPaused = isPaused;
  }

  /**
   * Gets the paused state
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Sets the initialization state
   */
  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  /**
   * Gets the initialization state
   */
  isInitializedState(): boolean {
    return this.isInitialized;
  }

  /**
   * Sets the initialization error state
   */
  setHasInitError(hasError: boolean): void {
    this.hasInitError = hasError;
  }

  /**
   * Gets the initialization error state
   */
  hasInitializationError(): boolean {
    return this.hasInitError;
  }

  /**
   * Sets the latest blob
   */
  setLatestBlob(blob: Blob | null): void {
    this.latestBlob = blob;
  }

  /**
   * Gets the latest blob
   */
  getFinalBlob(): Blob | null {
    return this.latestBlob;
  }

  /**
   * Sets the recording start time
   */
  setRecordingStartTime(startTime: number | null): void {
    this.recordingStartTime = startTime;
  }

  /**
   * Gets the recording start time
   */
  getRecordingStartTime(): number | null {
    return this.recordingStartTime;
  }

  /**
   * Gets the current state properties
   */
  getProperties(): RecorderStateProperties {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      isInitialized: this.isInitialized,
      hasInitError: this.hasInitError,
      latestBlob: this.latestBlob,
      recordingStartTime: this.recordingStartTime
    };
  }

  /**
   * Resets all state values
   */
  reset(): void {
    this.isRecording = false;
    this.isPaused = false;
    this.isInitialized = false;
    this.hasInitError = false;
    this.recordingStartTime = null;
    // Note: We don't reset the latestBlob since it might be needed after stopping
  }
}
