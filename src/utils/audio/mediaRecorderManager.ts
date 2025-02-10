
import { RecordingEvent, RecordingObserver, RecordingStats } from './types';
import { getMediaRecorderOptions } from './recordingConfig';

export class MediaRecorderManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private observers: Set<RecordingObserver> = new Set();

  addObserver(observer: RecordingObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: RecordingObserver): void {
    this.observers.delete(observer);
  }

  private notifyObservers(event: RecordingEvent): void {
    this.observers.forEach(observer => observer.update(event));
  }

  initialize(stream: MediaStream): void {
    const options = getMediaRecorderOptions();
    console.log('[MediaRecorderManager] Creating MediaRecorder with options:', options);
    this.mediaRecorder = new MediaRecorder(stream, options);
    this.setupEvents();
  }

  private setupEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      const eventData = {
        dataSize: event.data?.size,
        dataType: event.data?.type,
        timeStamp: event.timeStamp
      };
      console.log('[MediaRecorderManager] Data available event:', eventData);

      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
        console.log('[MediaRecorderManager] Total chunks:', this.audioChunks.length);
        this.notifyObservers({ 
          type: 'dataAvailable', 
          data: { chunk: event.data } 
        });
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('[MediaRecorderManager] MediaRecorder error:', event);
      this.notifyObservers({ 
        type: 'error', 
        data: { error: new Error('MediaRecorder error') } 
      });
    };

    this.mediaRecorder.onpause = () => {
      console.log('[MediaRecorderManager] MediaRecorder paused');
      this.notifyObservers({ type: 'pause' });
    };

    this.mediaRecorder.onresume = () => {
      console.log('[MediaRecorderManager] MediaRecorder resumed');
      this.notifyObservers({ type: 'resume' });
    };

    this.mediaRecorder.onstop = () => {
      console.log('[MediaRecorderManager] MediaRecorder stopped');
      this.notifyObservers({ type: 'stop' });
    };
  }

  start(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.start(250);
      this.notifyObservers({ type: 'start' });
    }
  }

  pause(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.resume();
    }
  }

  stop(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

  getRecordingStats(duration: number): RecordingStats {
    const finalBlob = new Blob(this.audioChunks, { 
      type: this.mediaRecorder?.mimeType || 'audio/webm'
    });

    return {
      blobSize: finalBlob.size,
      duration,
      chunks: this.audioChunks.length,
      mimeType: finalBlob.type
    };
  }

  getFinalBlob(): Blob {
    return new Blob(this.audioChunks, { 
      type: this.mediaRecorder?.mimeType || 'audio/webm'
    });
  }

  cleanup(): void {
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
