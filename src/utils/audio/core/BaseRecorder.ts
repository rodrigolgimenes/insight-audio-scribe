
import { MediaRecorderManager } from '../mediaRecorderManager';
import { RecordingObserver, RecordingResult, RecordingStats } from '../types/audioRecorderTypes';

export class BaseRecorder {
  private recordingInProgress = false;
  private isPaused = false;
  private startTime = 0;
  private pausedDuration = 0;
  private pauseStartTime = 0;
  private finalBlob: Blob | null = null;
  private mediaRecorderManager = new MediaRecorderManager();

  addObserver(observer: RecordingObserver): void {
    this.mediaRecorderManager.addObserver(observer);
  }

  removeObserver(observer: RecordingObserver): void {
    this.mediaRecorderManager.removeObserver(observer);
  }

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.recordingInProgress) {
      console.warn('[BaseRecorder] Recording already in progress');
      return;
    }

    try {
      console.log('[BaseRecorder] Initializing MediaRecorder');
      this.mediaRecorderManager.initialize(stream);
      
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.finalBlob = null;
      
      console.log('[BaseRecorder] Starting MediaRecorder');
      this.mediaRecorderManager.start();
      
      this.recordingInProgress = true;
      this.isPaused = false;
      console.log('[BaseRecorder] Recording started successfully');
    } catch (error) {
      console.error('[BaseRecorder] Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    if (!this.recordingInProgress) {
      console.warn('[BaseRecorder] No recording in progress to stop');
      return { blob: null, stats: this.getEmptyStats() };
    }

    try {
      console.log('[BaseRecorder] Stopping recording');
      this.mediaRecorderManager.stop();
      
      // Calculate the final duration
      const duration = this.getCurrentDuration();
      
      // Get the final blob
      this.finalBlob = this.mediaRecorderManager.getFinalBlob();
      
      // Get recording stats
      const stats = this.mediaRecorderManager.getRecordingStats(duration);
      
      this.recordingInProgress = false;
      this.isPaused = false;
      
      console.log('[BaseRecorder] Recording stopped, duration:', duration, 'blob size:', this.finalBlob?.size || 0);
      return { blob: this.finalBlob, stats };
    } catch (error) {
      console.error('[BaseRecorder] Error stopping recording:', error);
      this.recordingInProgress = false;
      this.isPaused = false;
      throw error;
    }
  }

  pauseRecording(): void {
    if (!this.recordingInProgress || this.isPaused) {
      return;
    }

    try {
      console.log('[BaseRecorder] Pausing recording');
      this.mediaRecorderManager.pause();
      
      this.pauseStartTime = Date.now();
      this.isPaused = true;
    } catch (error) {
      console.error('[BaseRecorder] Error pausing recording:', error);
      throw error;
    }
  }

  resumeRecording(): void {
    if (!this.recordingInProgress || !this.isPaused) {
      return;
    }

    try {
      console.log('[BaseRecorder] Resuming recording');
      this.mediaRecorderManager.resume();
      
      // Calculate time spent in paused state
      this.pausedDuration += (Date.now() - this.pauseStartTime);
      this.isPaused = false;
    } catch (error) {
      console.error('[BaseRecorder] Error resuming recording:', error);
      throw error;
    }
  }

  isCurrentlyRecording(): boolean {
    return this.recordingInProgress;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  getCurrentDuration(): number {
    if (!this.recordingInProgress) {
      return 0;
    }

    const currentTime = this.isPaused ? this.pauseStartTime : Date.now();
    const rawDuration = (currentTime - this.startTime) / 1000; // in seconds
    const adjustedDuration = rawDuration - (this.pausedDuration / 1000);
    
    return Math.max(0, adjustedDuration);
  }

  getFinalBlob(): Blob | null {
    return this.finalBlob;
  }

  private getEmptyStats(): RecordingStats {
    return {
      blobSize: 0,
      duration: 0,
      chunks: 0,
      mimeType: ''
    };
  }
}
