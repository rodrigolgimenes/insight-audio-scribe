
/**
 * Defines the core state of the audio recorder
 */
export interface IRecorderState {
  isCurrentlyRecording(): boolean;
  isPausedState(): boolean;
  isInitializedState(): boolean;
  hasInitializationError(): boolean;
  getFinalBlob(): Blob | null;
  getRecordingStartTime(): number | null;
  
  setIsRecording(isRecording: boolean): void;
  setIsPaused(isPaused: boolean): void;
  setIsInitialized(isInitialized: boolean): void;
  setHasInitError(hasError: boolean): void;
  setLatestBlob(blob: Blob | null): void;
  setRecordingStartTime(startTime: number | null): void;
  
  reset(): void;
}

/**
 * Properties of the recorder state
 */
export interface RecorderStateProperties {
  isRecording: boolean;
  isPaused: boolean;
  isInitialized: boolean;
  hasInitError: boolean;
  latestBlob: Blob | null;
  recordingStartTime: number | null;
}
