
import { RecordingResult, RecordingEvent, RecordingObserver } from './types';
import { logAudioTracks, validateAudioTracks } from './recordingHelpers';
import { DurationTracker } from './durationTracker';
import { MediaRecorderManager } from './mediaRecorderManager';
import { StreamManager } from './streamManager';

export class AudioRecorder {
  private isRecording = false;
  private durationTracker: DurationTracker;
  private mediaManager: MediaRecorderManager;
  private streamManager: StreamManager;

  constructor() {
    this.durationTracker = new DurationTracker();
    this.mediaManager = new MediaRecorderManager();
    this.streamManager = new StreamManager();
  }

  addObserver(observer: RecordingObserver): void {
    this.mediaManager.addObserver(observer);
  }

  removeObserver(observer: RecordingObserver): void {
    this.mediaManager.removeObserver(observer);
  }

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording');
      return;
    }

    try {
      logAudioTracks(stream);
      validateAudioTracks(stream);

      this.streamManager.initialize(stream, () => {
        if (this.isRecording) {
          this.stopRecording().catch(error => {
            console.error('[AudioRecorder] Error handling inactive stream:', error);
          });
        }
      });

      this.mediaManager.initialize(stream);
      this.durationTracker.startTracking();

      this.mediaManager.start();
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
      if (!this.isRecording) {
        reject(new Error('No recording in progress'));
        return;
      }

      try {
        const finalDuration = Math.round(this.durationTracker.getCurrentDuration() * 1000);
        const finalBlob = this.mediaManager.getFinalBlob();

        if (finalBlob.size === 0) {
          throw new Error('No audio data recorded');
        }

        const stats = this.mediaManager.getRecordingStats(finalDuration);
        console.log('[AudioRecorder] Recording stopped:', stats);

        this.cleanup();
        resolve({ blob: finalBlob, duration: finalDuration });
      } catch (error) {
        console.error('[AudioRecorder] Error finalizing recording:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  pauseRecording(): void {
    if (this.isRecording) {
      try {
        this.mediaManager.pause();
        this.durationTracker.pauseTracking();
        console.log('[AudioRecorder] Recording paused at:', this.durationTracker.getCurrentDuration());
      } catch (error) {
        console.error('[AudioRecorder] Error pausing recording:', error);
      }
    }
  }

  resumeRecording(): void {
    if (this.isRecording) {
      try {
        this.mediaManager.resume();
        this.durationTracker.resumeTracking();
        console.log('[AudioRecorder] Recording resumed from:', this.durationTracker.getCurrentDuration());
      } catch (error) {
        console.error('[AudioRecorder] Error resuming recording:', error);
      }
    }
  }

  private cleanup() {
    console.log('[AudioRecorder] Cleaning up resources');
    this.streamManager.cleanup();
    this.mediaManager.cleanup();
    this.durationTracker.cleanup();
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
