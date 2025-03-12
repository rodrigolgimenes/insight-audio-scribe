
import { MediaRecorderManager } from '../mediaRecorderManager';
import { DurationTracker } from '../helpers/durationTracker';
import { StreamManager } from '../helpers/streamManager';
import { IRecorderState } from '../types/recorderStateTypes';
import { RecordingResult } from '../types';
import { RecordingOperations } from './RecordingOperations';
import { BaseRecorderLifecycle } from './BaseRecorderLifecycle';

/**
 * Handles the lifecycle of the audio recorder (start, stop, pause, resume)
 */
export class RecorderLifecycle extends BaseRecorderLifecycle {
  private recordingOperations: RecordingOperations;
  
  constructor(
    private mediaRecorderManager: MediaRecorderManager,
    private durationTracker: DurationTracker,
    private streamManager: StreamManager,
    private recorderState: IRecorderState
  ) {
    super();
    this.recordingOperations = new RecordingOperations(
      mediaRecorderManager,
      durationTracker,
      recorderState
    );
  }

  /**
   * Starts recording with the provided media stream
   */
  async startRecording(stream: MediaStream): Promise<void> {
    const state = this.recorderState;
    
    this.logAction('startRecording called, current state', {
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState(),
      isInitialized: state.isInitializedState(),
      hasInitError: state.hasInitializationError(),
      streamTracks: stream ? stream.getTracks().length : 0
    });
    
    if (state.isCurrentlyRecording()) {
      this.logAction('Already recording, ignoring startRecording call');
      return;
    }

    if (state.hasInitializationError()) {
      this.logAction('Resetting from previous error state');
      state.setHasInitError(false);
      this.cleanup();
    }

    try {
      // Verify we have a valid stream with audio tracks
      this.validateStream(stream);

      // Initialize stream manager
      this.streamManager.initialize(stream, () => {
        if (state.isCurrentlyRecording()) {
          this.logAction('Stream ended unexpectedly, stopping recording');
          this.stopRecording().catch(error => {
            this.logError('in stream ended callback', error);
          });
        }
      });

      // Start the media recorder
      await this.recordingOperations.startMediaRecorder(stream);
      
    } catch (error) {
      this.logError('starting recording', error);
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
    
    this.logAction('stopRecording called, current state', {
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState(),
      recordingDuration: this.durationTracker.getCurrentDuration(),
      elapsedSinceStart: state.getRecordingStartTime() 
        ? (Date.now() - state.getRecordingStartTime()!) / 1000 
        : 'unknown'
    });
    
    if (!state.isCurrentlyRecording()) {
      this.logAction('Not currently recording, returning cached result');
      const finalDuration = this.durationTracker.getCurrentDuration();
      const latestBlob = state.getFinalBlob();
      
      if (latestBlob) {
        return { 
          blob: latestBlob, 
          stats: {
            blobSize: latestBlob.size,
            duration: finalDuration,
            chunks: 0,
            mimeType: latestBlob.type || 'audio/webm'
          },
          duration: finalDuration
        };
      }
      
      // Create an empty blob as fallback
      return { 
        blob: new Blob([], { type: 'audio/webm' }), 
        stats: {
          blobSize: 0,
          duration: 0,
          chunks: 0,
          mimeType: 'audio/webm'
        },
        duration: 0
      };
    }
    
    try {
      const result = await this.recordingOperations.stopMediaRecorder();
      this.cleanup();
      return result;
    } catch (error) {
      this.logError('stopping recording', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Pauses the current recording
   */
  pauseRecording(): void {
    const state = this.recorderState;
    
    this.logAction('pauseRecording called, current state', { 
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState()
    });
    
    if (state.isCurrentlyRecording() && !state.isPausedState()) {
      this.recordingOperations.pauseMediaRecorder();
    } else {
      console.warn('[RecorderLifecycle] Cannot pause: not recording or already paused');
    }
  }

  /**
   * Resumes a paused recording
   */
  resumeRecording(): void {
    const state = this.recorderState;
    
    this.logAction('resumeRecording called, current state', { 
      isRecording: state.isCurrentlyRecording(),
      isPaused: state.isPausedState()
    });
    
    if (state.isCurrentlyRecording() && state.isPausedState()) {
      this.recordingOperations.resumeMediaRecorder();
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
    this.logAction('Cleanup called');
    this.streamManager.cleanup();
    this.durationTracker.cleanup();
    this.mediaRecorderManager.cleanup();
    this.recorderState.reset();
  }
}
