
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
  private latestBlob: Blob | null = null;

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
    console.log('[AudioRecorder] startRecording called, current state:', this.isRecording);
    
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording, ignoring startRecording call');
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
      this.latestBlob = null;
      console.log('[AudioRecorder] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    console.log('[AudioRecorder] stopRecording called, current state:', this.isRecording);
    if (!this.isRecording) {
      console.log('[AudioRecorder] Not currently recording, returning cached result');
      const duration = this.durationTracker.getCurrentDuration();
      if (this.latestBlob) {
        return { blob: this.latestBlob, duration };
      }
      
      // Create an empty blob as fallback
      return { 
        blob: new Blob([], { type: 'audio/webm' }), 
        duration: 0 
      };
    }
    
    return new Promise((resolve, reject) => {
      try {
        const finalDuration = this.durationTracker.getCurrentDuration();
        this.mediaRecorderManager.stop();
        this.isRecording = false;
        this.durationTracker.stopTracking();

        setTimeout(() => {
          try {
            const finalBlob = this.mediaRecorderManager.getFinalBlob();
            this.latestBlob = finalBlob;
            
            console.log('[AudioRecorder] Recording stopped:', 
              this.mediaRecorderManager.getRecordingStats(finalDuration)
            );
            
            this.cleanup();
            resolve({ blob: finalBlob, duration: finalDuration });
          } catch (error) {
            console.error('[AudioRecorder] Error finalizing recording:', error);
            this.cleanup();
            reject(error);
          }
        }, 300); // Increased timeout to ensure all data is processed
      } catch (error) {
        console.error('[AudioRecorder] Error stopping recording:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  pauseRecording(): void {
    console.log('[AudioRecorder] pauseRecording called, current state:', this.isRecording);
    if (this.isRecording) {
      this.mediaRecorderManager.pause();
      this.durationTracker.pauseTracking();
      console.log('[AudioRecorder] Recording paused at:', this.durationTracker.getCurrentDuration());
    }
  }

  resumeRecording(): void {
    console.log('[AudioRecorder] resumeRecording called, current state:', this.isRecording);
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
  
  getFinalBlob(): Blob | null {
    return this.latestBlob || (this.mediaRecorderManager ? this.mediaRecorderManager.getFinalBlob() : null);
  }
}
