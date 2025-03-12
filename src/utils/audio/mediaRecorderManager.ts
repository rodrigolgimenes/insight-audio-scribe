
import { RecordingEvent, RecordingObserver, RecordingStats } from './types';
import { getMediaRecorderOptions } from './recordingConfig';
import { ObserverManager } from './observers/ObserverManager';
import { MediaRecorderEvents } from './media/MediaRecorderEvents';
import { AudioChunksManager } from './media/AudioChunksManager';

export class MediaRecorderManager {
  private mediaRecorder: MediaRecorder | null = null;
  private observerManager = new ObserverManager();
  private eventsManager: MediaRecorderEvents;
  private chunksManager = new AudioChunksManager();

  constructor() {
    this.eventsManager = new MediaRecorderEvents(this.observerManager);
  }

  addObserver(observer: RecordingObserver): void {
    this.observerManager.addObserver(observer);
  }

  removeObserver(observer: RecordingObserver): void {
    this.observerManager.removeObserver(observer);
  }

  initialize(stream: MediaStream): void {
    const options = getMediaRecorderOptions();
    console.log('[MediaRecorderManager] Creating MediaRecorder with options:', options);
    this.mediaRecorder = new MediaRecorder(stream, options);
    
    if (this.mediaRecorder.mimeType) {
      this.chunksManager.setMimeType(this.mediaRecorder.mimeType);
    }
    
    this.eventsManager.setupEvents(this.mediaRecorder, (event) => {
      this.chunksManager.addChunk(event.data);
    });
  }

  start(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      console.log('[MediaRecorderManager] Starting recording');
      this.chunksManager.clearChunks();
      this.mediaRecorder.start(250);
    } else {
      console.warn('[MediaRecorderManager] Cannot start recording:', this.mediaRecorder?.state);
    }
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.log('[MediaRecorderManager] Pausing recording');
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      console.log('[MediaRecorderManager] Resuming recording');
      this.mediaRecorder.resume();
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      console.log('[MediaRecorderManager] Stopping recording');
      this.mediaRecorder.stop();
    }
  }

  getRecordingStats(duration: number): RecordingStats {
    return this.chunksManager.getRecordingStats(duration);
  }

  getFinalBlob(): Blob {
    return this.chunksManager.getFinalBlob();
  }

  cleanup(): void {
    this.mediaRecorder = null;
    this.chunksManager.clearChunks();
    // No need to clear observers as they might be reused
  }
}
