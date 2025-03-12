
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
  private isPaused = false;
  private isInitialized = false;
  private latestBlob: Blob | null = null;
  private recordingStartTime: number | null = null;

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
    console.log('[AudioRecorder] startRecording called, current state:', {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      isInitialized: this.isInitialized
    });
    
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording, ignoring startRecording call');
      return;
    }

    try {
      // Validate stream before proceeding
      logAudioTracks(stream);
      validateAudioTracks(stream);

      // Initialize components with the stream
      this.mediaRecorderManager.initialize(stream);
      this.streamManager.initialize(stream, () => {
        if (this.isRecording) {
          console.log('[AudioRecorder] Stream ended unexpectedly, stopping recording');
          this.stopRecording();
        }
      });

      // Start tracking duration and recording
      this.durationTracker.startTracking();
      this.mediaRecorderManager.start();
      
      // Update state
      this.isRecording = true;
      this.isPaused = false;
      this.isInitialized = true;
      this.latestBlob = null;
      this.recordingStartTime = Date.now();
      
      console.log('[AudioRecorder] Recording started successfully at', new Date(this.recordingStartTime).toISOString());
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    console.log('[AudioRecorder] stopRecording called, current state:', {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      recordingDuration: this.durationTracker.getCurrentDuration(),
      elapsedSinceStart: this.recordingStartTime ? (Date.now() - this.recordingStartTime) / 1000 : 'unknown'
    });
    
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
        this.isPaused = false;
        this.durationTracker.stopTracking();

        // Use a timeout to ensure all data is processed
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
    console.log('[AudioRecorder] pauseRecording called, current state:', { 
      isRecording: this.isRecording,
      isPaused: this.isPaused
    });
    
    if (this.isRecording && !this.isPaused) {
      this.mediaRecorderManager.pause();
      this.durationTracker.pauseTracking();
      this.isPaused = true;
      console.log('[AudioRecorder] Recording paused at:', this.durationTracker.getCurrentDuration());
    } else {
      console.warn('[AudioRecorder] Cannot pause: not recording or already paused');
    }
  }

  resumeRecording(): void {
    console.log('[AudioRecorder] resumeRecording called, current state:', { 
      isRecording: this.isRecording,
      isPaused: this.isPaused
    });
    
    if (this.isRecording && this.isPaused) {
      this.mediaRecorderManager.resume();
      this.durationTracker.resumeTracking();
      this.isPaused = false;
      console.log('[AudioRecorder] Recording resumed from:', this.durationTracker.getCurrentDuration());
    } else {
      console.warn('[AudioRecorder] Cannot resume: not recording or not paused');
    }
  }

  private cleanup(): void {
    console.log('[AudioRecorder] Cleaning up resources');
    this.mediaRecorderManager.cleanup();
    this.durationTracker.cleanup();
    this.streamManager.cleanup();
    this.isRecording = false;
    this.isPaused = false;
    this.recordingStartTime = null;
    console.log('[AudioRecorder] Cleanup complete');
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  getCurrentDuration(): number {
    return this.durationTracker.getCurrentDuration();
  }
  
  getFinalBlob(): Blob | null {
    return this.latestBlob || (this.mediaRecorderManager ? this.mediaRecorderManager.getFinalBlob() : null);
  }
}
