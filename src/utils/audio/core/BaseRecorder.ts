
import { RecordingObserver, RecordingResult } from '../types';
import { MediaRecorderManager } from '../mediaRecorderManager';
import { DurationTracker } from '../helpers/durationTracker';
import { StreamManager } from '../helpers/streamManager';
import { RecorderState } from './RecorderState';
import { RecorderLifecycle } from './RecorderLifecycle';

export type { RecordingObserver, RecordingEvent } from '../types/audioRecorderTypes';

export class BaseRecorder {
  protected mediaRecorderManager: MediaRecorderManager;
  protected durationTracker: DurationTracker;
  protected streamManager: StreamManager;
  protected recorderState: RecorderState;
  protected recorderLifecycle: RecorderLifecycle;

  constructor() {
    this.mediaRecorderManager = new MediaRecorderManager();
    this.durationTracker = new DurationTracker();
    this.streamManager = new StreamManager();
    this.recorderState = new RecorderState();
    this.recorderLifecycle = new RecorderLifecycle(
      this.mediaRecorderManager,
      this.durationTracker,
      this.streamManager,
      this.recorderState
    );
  }

  addObserver(observer: RecordingObserver): void {
    this.mediaRecorderManager.addObserver(observer);
  }

  removeObserver(observer: RecordingObserver): void {
    this.mediaRecorderManager.removeObserver(observer);
  }

  async startRecording(stream: MediaStream): Promise<void> {
    return this.recorderLifecycle.startRecording(stream);
  }

  async stopRecording(): Promise<RecordingResult> {
    return this.recorderLifecycle.stopRecording();
  }

  pauseRecording(): void {
    this.recorderLifecycle.pauseRecording();
  }

  resumeRecording(): void {
    this.recorderLifecycle.resumeRecording();
  }

  getCurrentDuration(): number {
    return this.recorderLifecycle.getCurrentDuration();
  }

  cleanup(): void {
    this.recorderLifecycle.cleanup();
  }

  // Helper methods for external components that need state information
  isCurrentlyRecording(): boolean {
    return this.recorderState.isCurrentlyRecording();
  }

  isPausedState(): boolean {
    return this.recorderState.isPausedState();
  }

  getFinalBlob(): Blob | null {
    return this.recorderState.getFinalBlob();
  }
}
