
import { RecordingEvent, RecordingObserver, RecordingResult } from './types';
import { MediaRecorderManager } from './mediaRecorderManager';
import { DurationTracker } from './durationTracker';
import { StreamManager } from './streamManager';
import { logAudioTracks, validateAudioTracks } from './recordingHelpers';

export class AudioRecorder {
  private mediaRecorderManager: MediaRecorderManager;
  private durationTracker: DurationTracker;
  private streamManager: StreamManager;
  private isRecording = false;

  constructor() {
    this.mediaRecorderManager = new MediaRecorderManager();
    this.durationTracker = new DurationTracker();
    this.streamManager = new StreamManager();
  }

  addObserver(observer: RecordingObserver): void {
    this.mediaRecorderManager.addObserver(observer);
  }

  removeObserver(observer: RecordingObserver): void {
    this.mediaRecorderManager.removeObserver(observer);
  }

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording');
      return;
    }

    try {
      logAudioTracks(stream);
      validateAudioTracks(stream);

      this.mediaRecorderManager.initialize(stream);
      this.streamManager.initialize(stream, () => {
        if (this.isRecording) {
          this.stopRecording();
        }
      });

      this.durationTracker.startTracking();
      this.mediaRecorderManager.start();
      this.isRecording = true;
      console.log('[AudioRecorder] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      try {
        const finalDuration = this.durationTracker.getCurrentDuration();
        this.mediaRecorderManager.stop();
        this.isRecording = false;
        this.durationTracker.stopTracking();

        setTimeout(() => {
          try {
            const finalBlob = this.mediaRecorderManager.getFinalBlob();
            console.log('[AudioRecorder] Recording stopped:', 
              this.mediaRecorderManager.getRecordingStats(finalDuration)
            );
            this.cleanup();
            resolve({ blob: finalBlob, duration: finalDuration });
          } catch (error) {
            console.error('[AudioRecorder] Error finalizing recording:', error);
            reject(error);
          }
        }, 100);
      } catch (error) {
        console.error('[AudioRecorder] Error stopping recording:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  pauseRecording(): void {
    if (this.isRecording) {
      this.mediaRecorderManager.pause();
      this.durationTracker.pauseTracking();
      console.log('[AudioRecorder] Recording paused at:', this.durationTracker.getCurrentDuration());
    }
  }

  resumeRecording(): void {
    if (this.isRecording) {
      this.mediaRecorderManager.resume();
      this.durationTracker.resumeTracking();
      console.log('[AudioRecorder] Recording resumed from:', this.durationTracker.getCurrentDuration());
    }
  }

  private cleanup(): void {
    console.log('[AudioRecorder] Cleaning up resources');
    this.mediaRecorderManager.cleanup();
    this.durationTracker.cleanup();
    this.streamManager.cleanup();
    this.isRecording = false;
    console.log('[AudioRecorder] Cleanup complete');
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentDuration(): number {
    return this.durationTracker.getCurrentDuration();
  }
}
