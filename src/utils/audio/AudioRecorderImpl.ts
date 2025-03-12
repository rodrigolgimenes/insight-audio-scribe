
import { DurationTracker } from "./helpers/durationTracker";
import { StreamManager } from "./helpers/streamManager";
import { RecordingResult, RecordingStats, RecordingEvent, RecordingObserver } from "./types/audioRecorderTypes";
import { getSupportedMimeType, createMediaRecorderOptions, logAudioTracks, validateAudioTracks } from "./helpers/mediaRecorderUtils";
import { ObserverManager } from "./observers/ObserverManager";
import { MediaRecorderEvents } from "./media/MediaRecorderEvents";
import { AudioChunksManager } from "./media/AudioChunksManager";
import { IAudioRecorder } from "./interfaces/IAudioRecorder";

export class AudioRecorderImpl implements IAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private durationTracker: DurationTracker;
  private streamManager: StreamManager;
  private observerManager: ObserverManager;
  private mediaRecorderEvents: MediaRecorderEvents;
  private audioChunksManager: AudioChunksManager;
  private isRecording = false;
  private isPaused = false;

  constructor() {
    this.durationTracker = new DurationTracker();
    this.streamManager = new StreamManager();
    this.observerManager = new ObserverManager();
    this.mediaRecorderEvents = new MediaRecorderEvents(this.observerManager);
    this.audioChunksManager = new AudioChunksManager();
    console.log('[AudioRecorder] Initialized');
  }

  /**
   * Add an observer to receive recording events
   */
  addObserver(observer: RecordingObserver): void {
    this.observerManager.addObserver(observer);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer: RecordingObserver): void {
    this.observerManager.removeObserver(observer);
  }

  /**
   * Starts recording audio from the provided stream
   * @param stream MediaStream to record from
   */
  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording');
      return;
    }

    try {
      // Log and validate audio tracks
      logAudioTracks(stream);
      validateAudioTracks(stream);

      // Reset state
      this.audioChunksManager.clearChunks();
      this.streamManager.initialize(stream, () => {
        if (this.isRecording) {
          console.log('[AudioRecorder] Stream ended unexpectedly, stopping recording');
          this.stopRecording().catch(error => {
            console.error('[AudioRecorder] Error in stream ended callback:', error);
          });
        }
      });
      
      // Get supported mime type
      const mimeType = getSupportedMimeType();
      this.audioChunksManager.setMimeType(mimeType);
      const options = createMediaRecorderOptions(mimeType);
      
      console.log('[AudioRecorder] Creating MediaRecorder with options:', options);
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorderEvents.setupEvents(
        this.mediaRecorder,
        (event: BlobEvent) => this.audioChunksManager.addChunk(event.data)
      );
      
      // Start tracking duration
      this.durationTracker.start();
      
      // Start recording
      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.isPaused = false;
      
      // Notify observers
      this.observerManager.notifyObservers({ type: 'start' });
      
      console.log('[AudioRecorder] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stops the recording and returns the recorded audio
   * @returns Promise resolving to the recording result
   */
  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No recording in progress'));
        return;
      }

      const finalDuration = this.durationTracker.getCurrentDuration();
      
      this.mediaRecorder.onstop = () => {
        try {
          if (this.audioChunksManager.getChunkCount() === 0) {
            throw new Error('No audio data recorded');
          }

          const finalBlob = this.audioChunksManager.getFinalBlob();
          if (!finalBlob) {
            throw new Error('Failed to create final audio blob');
          }

          const stats: RecordingStats = this.audioChunksManager.getRecordingStats(finalDuration);

          console.log('[AudioRecorder] Recording stopped:', stats);
          this.observerManager.notifyObservers({ 
            type: 'stop', 
            data: { stats } 
          });

          this.cleanup();
          resolve({ blob: finalBlob, duration: finalDuration });
        } catch (error) {
          console.error('[AudioRecorder] Error finalizing recording:', error);
          this.cleanup();
          reject(error);
        }
      };

      try {
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.isPaused = false;
        this.durationTracker.stop();
      } catch (error) {
        console.error('[AudioRecorder] Error stopping MediaRecorder:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Pauses the current recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      try {
        this.mediaRecorder.pause();
        this.durationTracker.pause();
        this.isPaused = true;
        console.log('[AudioRecorder] Recording paused at:', this.durationTracker.getCurrentDuration());
        this.observerManager.notifyObservers({ type: 'pause' });
      } catch (error) {
        console.error('[AudioRecorder] Error pausing recording:', error);
      }
    }
  }

  /**
   * Resumes a paused recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      try {
        this.mediaRecorder.resume();
        this.durationTracker.resume();
        this.isPaused = false;
        console.log('[AudioRecorder] Recording resumed at:', this.durationTracker.getCurrentDuration());
        this.observerManager.notifyObservers({ type: 'resume' });
      }
      catch (error) {
        console.error('[AudioRecorder] Error resuming recording:', error);
      }
    }
  }

  /**
   * Releases all resources
   */
  private cleanup(): void {
    console.log('[AudioRecorder] Cleaning up resources');
    this.streamManager.cleanup();
    this.durationTracker.cleanup();
    this.mediaRecorder = null;
    this.isRecording = false;
    this.isPaused = false;
    console.log('[AudioRecorder] Cleanup complete');
  }

  /**
   * Gets the final blob from recording
   * @returns The final audio blob or null if no recording
   */
  getFinalBlob(): Blob | null {
    return this.audioChunksManager.getFinalBlob();
  }

  /**
   * Checks if currently recording
   * @returns True if recording is in progress
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Gets the current recording duration
   * @returns The current duration in seconds
   */
  getCurrentDuration(): number {
    return this.durationTracker.getCurrentDuration();
  }
}
