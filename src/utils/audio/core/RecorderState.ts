
import { IRecorderState } from '../types/recorderStateTypes';
import { RecorderStateFactory } from './state/RecorderStateFactory';

/**
 * Manages the state of the audio recorder
 * @deprecated Use RecorderStateImpl from './state/RecorderStateImpl' instead
 */
export class RecorderState implements IRecorderState {
  private implementation: IRecorderState;

  constructor() {
    this.implementation = RecorderStateFactory.createRecorderState();
  }

  setIsRecording(isRecording: boolean): void {
    this.implementation.setIsRecording(isRecording);
  }

  isCurrentlyRecording(): boolean {
    return this.implementation.isCurrentlyRecording();
  }

  setIsPaused(isPaused: boolean): void {
    this.implementation.setIsPaused(isPaused);
  }

  isPausedState(): boolean {
    return this.implementation.isPausedState();
  }

  setIsInitialized(isInitialized: boolean): void {
    this.implementation.setIsInitialized(isInitialized);
  }

  isInitializedState(): boolean {
    return this.implementation.isInitializedState();
  }

  setHasInitError(hasError: boolean): void {
    this.implementation.setHasInitError(hasError);
  }

  hasInitializationError(): boolean {
    return this.implementation.hasInitializationError();
  }

  setLatestBlob(blob: Blob | null): void {
    this.implementation.setLatestBlob(blob);
  }

  getFinalBlob(): Blob | null {
    return this.implementation.getFinalBlob();
  }

  setRecordingStartTime(startTime: number | null): void {
    this.implementation.setRecordingStartTime(startTime);
  }

  getRecordingStartTime(): number | null {
    return this.implementation.getRecordingStartTime();
  }

  reset(): void {
    this.implementation.reset();
  }
}
