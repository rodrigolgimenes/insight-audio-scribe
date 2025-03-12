
import { RecordingObserver, RecordingResult } from '../types';
import { MediaRecorderManager } from '../mediaRecorderManager';
import { DurationTracker } from '../durationTracker';
import { StreamManager } from '../streamManager';
import { logAudioTracks, validateAudioTracks } from '../recordingHelpers';

export class BaseRecorder {
  protected mediaRecorderManager: MediaRecorderManager;
  protected durationTracker: DurationTracker;
  protected streamManager: StreamManager;
  protected isRecording = false;
  protected isPaused = false;
  protected isInitialized = false;
  protected latestBlob: Blob | null = null;
  protected recordingStartTime: number | null = null;
  protected hasInitError = false;

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
    console.log('[BaseRecorder] startRecording called, current state:', {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      isInitialized: this.isInitialized,
      hasInitError: this.hasInitError,
      streamTracks: stream ? stream.getTracks().length : 0
    });
    
    if (this.isRecording) {
      console.log('[BaseRecorder] Already recording, ignoring startRecording call');
      return;
    }

    if (this.hasInitError) {
      console.log('[BaseRecorder] Resetting from previous error state');
      this.hasInitError = false;
      this.cleanup();
    }

    try {
      // Verify we have a valid stream with audio tracks
      if (!stream) {
        throw new Error('No media stream provided');
      }
      
      // Validate stream before proceeding
      logAudioTracks(stream);
      validateAudioTracks(stream);

      // Initialize components with the stream
      this.mediaRecorderManager.initialize(stream);
      this.streamManager.initialize(stream, () => {
        if (this.isRecording) {
          console.log('[BaseRecorder] Stream ended unexpectedly, stopping recording');
          this.stopRecording().catch(error => {
            console.error('[BaseRecorder] Error in stream ended callback:', error);
          });
        }
      });

      // Start tracking duration and recording with proper error handling
      this.durationTracker.startTracking();
      
      try {
        this.mediaRecorderManager.start();
      } catch (startError) {
        console.error('[BaseRecorder] Error starting MediaRecorder:', startError);
        throw new Error(`Failed to start recording: ${startError.message}`);
      }
      
      // Update state
      this.isRecording = true;
      this.isPaused = false;
      this.isInitialized = true;
      this.latestBlob = null;
      this.recordingStartTime = Date.now();
      
      console.log('[BaseRecorder] Recording started successfully at', new Date(this.recordingStartTime).toISOString());
    } catch (error) {
      console.error('[BaseRecorder] Error starting recording:', error);
      this.hasInitError = true;
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    console.log('[BaseRecorder] stopRecording called, current state:', {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      recordingDuration: this.durationTracker.getCurrentDuration(),
      elapsedSinceStart: this.recordingStartTime ? (Date.now() - this.recordingStartTime) / 1000 : 'unknown'
    });
    
    if (!this.isRecording) {
      console.log('[BaseRecorder] Not currently recording, returning cached result');
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
            
            console.log('[BaseRecorder] Recording stopped:', 
              this.mediaRecorderManager.getRecordingStats(finalDuration)
            );
            
            this.cleanup();
            resolve({ blob: finalBlob, duration: finalDuration });
          } catch (error) {
            console.error('[BaseRecorder] Error finalizing recording:', error);
            this.cleanup();
            reject(error);
          }
        }, 500); // Increased timeout to ensure all data is processed
      } catch (error) {
        console.error('[BaseRecorder] Error stopping recording:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  pauseRecording(): void {
    console.log('[BaseRecorder] pauseRecording called, current state:', { 
      isRecording: this.isRecording,
      isPaused: this.isPaused
    });
    
    if (this.isRecording && !this.isPaused) {
      this.mediaRecorderManager.pause();
      this.durationTracker.pauseTracking();
      this.isPaused = true;
      console.log('[BaseRecorder] Recording paused at:', this.durationTracker.getCurrentDuration());
    } else {
      console.warn('[BaseRecorder] Cannot pause: not recording or already paused');
    }
  }

  resumeRecording(): void {
    console.log('[BaseRecorder] resumeRecording called, current state:', { 
      isRecording: this.isRecording,
      isPaused: this.isPaused
    });
    
    if (this.isRecording && this.isPaused) {
      this.mediaRecorderManager.resume();
      this.durationTracker.resumeTracking();
      this.isPaused = false;
      console.log('[BaseRecorder] Recording resumed at:', this.durationTracker.getCurrentDuration());
    } else {
      console.warn('[BaseRecorder] Cannot resume: not recording or not paused');
    }
  }

  getCurrentDuration(): number {
    return this.durationTracker.getCurrentDuration();
  }

  cleanup(): void {
    console.log('[BaseRecorder] Cleanup called');
    this.streamManager.cleanup();
    this.durationTracker.cleanup();
    this.mediaRecorderManager.cleanup();
    this.isRecording = false;
    this.isPaused = false;
    this.isInitialized = false;
    this.recordingStartTime = null;
  }
}
