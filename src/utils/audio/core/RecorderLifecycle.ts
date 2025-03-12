
import { MediaRecorderManager } from '../mediaRecorderManager';
import { DurationTracker } from '../durationTracker';
import { StreamManager } from '../streamManager';
import { RecorderState } from './RecorderState';
import { logAudioTracks, validateAudioTracks } from '../recordingHelpers';
import { RecordingResult } from '../types';

/**
 * Handles the lifecycle of the audio recorder (start, stop, pause, resume)
 */
export class RecorderLifecycle {
  constructor(
    private mediaRecorderManager: MediaRecorderManager,
    private durationTracker: DurationTracker,
    private streamManager: StreamManager,
    private recorderState: RecorderState
  ) {}

  /**
   * Starts recording with the provided media stream
   */
  async startRecording(stream: MediaStream): Promise<void> {
    const state = this.recorderState;
    
    console.log('[RecorderLifecycle] startRecording called, current state:', {
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState(),
      isInitialized: state.isInitializedState(),
      hasInitError: state.hasInitializationError(),
      streamTracks: stream ? stream.getTracks().length : 0
    });
    
    if (state.isCurrentlyRecording()) {
      console.log('[RecorderLifecycle] Already recording, ignoring startRecording call');
      return;
    }

    if (state.hasInitializationError()) {
      console.log('[RecorderLifecycle] Resetting from previous error state');
      state.setHasInitError(false);
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
        if (state.isCurrentlyRecording()) {
          console.log('[RecorderLifecycle] Stream ended unexpectedly, stopping recording');
          this.stopRecording().catch(error => {
            console.error('[RecorderLifecycle] Error in stream ended callback:', error);
          });
        }
      });

      // Start tracking duration
      this.durationTracker.startTracking();
      
      try {
        this.mediaRecorderManager.start();
      } catch (startError) {
        console.error('[RecorderLifecycle] Error starting MediaRecorder:', startError);
        throw new Error(`Failed to start recording: ${startError.message}`);
      }
      
      // Update state
      state.setIsRecording(true);
      state.setIsPaused(false);
      state.setIsInitialized(true);
      state.setLatestBlob(null);
      state.setRecordingStartTime(Date.now());
      
      console.log('[RecorderLifecycle] Recording started successfully at', 
        new Date(state.getRecordingStartTime() || 0).toISOString());
    } catch (error) {
      console.error('[RecorderLifecycle] Error starting recording:', error);
      state.setHasInitError(true);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stops the current recording
   */
  async stopRecording(): Promise<RecordingResult> {
    const state = this.recorderState;
    
    console.log('[RecorderLifecycle] stopRecording called, current state:', {
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState(),
      recordingDuration: this.durationTracker.getCurrentDuration(),
      elapsedSinceStart: state.getRecordingStartTime() 
        ? (Date.now() - state.getRecordingStartTime()!) / 1000 
        : 'unknown'
    });
    
    if (!state.isCurrentlyRecording()) {
      console.log('[RecorderLifecycle] Not currently recording, returning cached result');
      const duration = this.durationTracker.getCurrentDuration();
      const latestBlob = state.getFinalBlob();
      
      if (latestBlob) {
        return { blob: latestBlob, duration };
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
        state.setIsRecording(false);
        state.setIsPaused(false);
        this.durationTracker.stopTracking();

        // Use a timeout to ensure all data is processed
        setTimeout(() => {
          try {
            const finalBlob = this.mediaRecorderManager.getFinalBlob();
            state.setLatestBlob(finalBlob);
            
            console.log('[RecorderLifecycle] Recording stopped:', 
              this.mediaRecorderManager.getRecordingStats(finalDuration)
            );
            
            this.cleanup();
            resolve({ blob: finalBlob, duration: finalDuration });
          } catch (error) {
            console.error('[RecorderLifecycle] Error finalizing recording:', error);
            this.cleanup();
            reject(error);
          }
        }, 500); // Increased timeout to ensure all data is processed
      } catch (error) {
        console.error('[RecorderLifecycle] Error stopping recording:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Pauses the current recording
   */
  pauseRecording(): void {
    const state = this.recorderState;
    
    console.log('[RecorderLifecycle] pauseRecording called, current state:', { 
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState()
    });
    
    if (state.isCurrentlyRecording() && !state.isPausedState()) {
      this.mediaRecorderManager.pause();
      this.durationTracker.pauseTracking();
      state.setIsPaused(true);
      console.log('[RecorderLifecycle] Recording paused at:', this.durationTracker.getCurrentDuration());
    } else {
      console.warn('[RecorderLifecycle] Cannot pause: not recording or already paused');
    }
  }

  /**
   * Resumes a paused recording
   */
  resumeRecording(): void {
    const state = this.recorderState;
    
    console.log('[RecorderLifecycle] resumeRecording called, current state:', { 
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState()
    });
    
    if (state.isCurrentlyRecording() && state.isPausedState()) {
      this.mediaRecorderManager.resume();
      this.durationTracker.resumeTracking();
      state.setIsPaused(false);
      console.log('[RecorderLifecycle] Recording resumed at:', this.durationTracker.getCurrentDuration());
    } else {
      console.warn('[RecorderLifecycle] Cannot resume: not recording or not paused');
    }
  }

  /**
   * Gets the current recording duration
   */
  getCurrentDuration(): number {
    return this.durationTracker.getCurrentDuration();
  }

  /**
   * Cleans up all resources
   */
  cleanup(): void {
    console.log('[RecorderLifecycle] Cleanup called');
    this.streamManager.cleanup();
    this.durationTracker.cleanup();
    this.mediaRecorderManager.cleanup();
    this.recorderState.reset();
  }
}
