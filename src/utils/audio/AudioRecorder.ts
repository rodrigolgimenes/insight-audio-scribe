
import { DurationTracker } from "./helpers/durationTracker";
import { StreamManager } from "./helpers/streamManager";
import { RecordingResult, RecordingStats } from "./types/audioRecorderTypes";
import { getSupportedMimeType, createMediaRecorderOptions, logAudioTracks, validateAudioTracks } from "./helpers/mediaRecorderUtils";
import { RecordingObserver } from "./types";

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private durationTracker: DurationTracker;
  private streamManager: StreamManager;
  private isRecording = false;
  private isPaused = false;
  private mimeType = '';
  private observers: Set<RecordingObserver> = new Set();

  constructor() {
    this.durationTracker = new DurationTracker();
    this.streamManager = new StreamManager();
    console.log('[AudioRecorder] Initialized');
  }

  /**
   * Add an observer to receive recording events
   */
  addObserver(observer: RecordingObserver): void {
    this.observers.add(observer);
    console.log('[AudioRecorder] Observer added, total observers:', this.observers.size);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer: RecordingObserver): void {
    this.observers.delete(observer);
    console.log('[AudioRecorder] Observer removed, total observers:', this.observers.size);
  }

  /**
   * Notify all observers about an event
   */
  private notifyObservers(event: { type: string, data?: any }): void {
    this.observers.forEach(observer => {
      try {
        observer.update(event);
      } catch (error) {
        console.error('[AudioRecorder] Error in observer notification:', error);
      }
    });
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
      this.audioChunks = [];
      this.streamManager.initialize(stream, () => {
        if (this.isRecording) {
          console.log('[AudioRecorder] Stream ended unexpectedly, stopping recording');
          this.stopRecording().catch(error => {
            console.error('[AudioRecorder] Error in stream ended callback:', error);
          });
        }
      });
      
      // Get supported mime type
      this.mimeType = getSupportedMimeType();
      const options = createMediaRecorderOptions(this.mimeType);
      
      console.log('[AudioRecorder] Creating MediaRecorder with options:', options);
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.configureMediaRecorderEvents();
      
      // Start tracking duration
      this.durationTracker.start();
      
      // Start recording
      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.isPaused = false;
      
      // Notify observers
      this.notifyObservers({ type: 'start' });
      
      console.log('[AudioRecorder] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Configures event handlers for the MediaRecorder
   */
  private configureMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;
    
    this.mediaRecorder.onstart = () => {
      console.log('[AudioRecorder] MediaRecorder started');
    };

    this.mediaRecorder.ondataavailable = (event) => {
      console.log('[AudioRecorder] Data available event:', {
        dataSize: event.data?.size,
        dataType: event.data?.type,
        timeStamp: event.timeStamp
      });

      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
        console.log('[AudioRecorder] Total chunks:', this.audioChunks.length);
        this.notifyObservers({ 
          type: 'dataAvailable', 
          data: { chunk: event.data } 
        });
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('[AudioRecorder] MediaRecorder error:', event);
      this.notifyObservers({ 
        type: 'error', 
        data: { error: new Error('MediaRecorder error') } 
      });
      this.cleanup();
    };

    this.mediaRecorder.onpause = () => {
      console.log('[AudioRecorder] MediaRecorder paused');
      this.notifyObservers({ type: 'pause' });
    };

    this.mediaRecorder.onresume = () => {
      console.log('[AudioRecorder] MediaRecorder resumed');
      this.notifyObservers({ type: 'resume' });
    };

    this.mediaRecorder.onstop = () => {
      console.log('[AudioRecorder] MediaRecorder stopped');
      this.notifyObservers({ type: 'stop' });
    };
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
          if (this.audioChunks.length === 0) {
            throw new Error('No audio data recorded');
          }

          const finalBlob = new Blob(this.audioChunks, { 
            type: this.mimeType || 'audio/webm'
          });

          const stats: RecordingStats = {
            blobSize: finalBlob.size,
            duration: finalDuration,
            chunks: this.audioChunks.length,
            mimeType: finalBlob.type
          };

          console.log('[AudioRecorder] Recording stopped:', stats);
          this.notifyObservers({ 
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
        this.notifyObservers({ type: 'pause' });
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
        this.notifyObservers({ type: 'resume' });
      } catch (error) {
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
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    console.log('[AudioRecorder] Cleanup complete');
  }

  /**
   * Gets the final blob from recording
   * @returns The final audio blob or null if no recording
   */
  getFinalBlob(): Blob | null {
    if (this.audioChunks.length === 0) return null;
    
    return new Blob(this.audioChunks, { 
      type: this.mimeType || 'audio/webm' 
    });
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
