
import { RecordingEvent, RecordingObserver } from './types';

interface RecordingResult {
  blob: Blob;
  duration: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private startTime: number = 0;
  private recordedDuration: number = 0;
  private timerId: number | null = null;
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

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording');
      return;
    }

    try {
      const audioTracks = stream.getAudioTracks();
      console.log('[AudioRecorder] Audio tracks:', {
        count: audioTracks.length,
        tracks: audioTracks.map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        }))
      });

      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in stream');
      }

      this.audioChunks = [];
      this.stream = stream;
      this.recordedDuration = 0;
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      let selectedMimeType = mimeTypes.find(type => {
        try {
          const isSupported = MediaRecorder.isTypeSupported(type);
          console.log(`[AudioRecorder] MIME type ${type} supported:`, isSupported);
          return isSupported;
        } catch (e) {
          console.warn(`[AudioRecorder] Error checking mime type ${type}:`, e);
          return false;
        }
      });
      
      if (!selectedMimeType) {
        console.warn('[AudioRecorder] No preferred mime types supported, using default');
        selectedMimeType = '';
      }
      
      const options: MediaRecorderOptions = {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      };
      
      console.log('[AudioRecorder] Creating MediaRecorder with options:', options);
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.onstart = () => {
        console.log('[AudioRecorder] MediaRecorder started');
        this.notifyObservers({ type: 'start' });
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

      // Start tracking duration
      this.startTime = Date.now();
      this.timerId = window.setInterval(() => {
        this.recordedDuration = (Date.now() - this.startTime) / 1000;
      }, 100);

      this.mediaRecorder.start(250);
      this.isRecording = true;
      console.log('[AudioRecorder] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.stream) {
        reject(new Error('No recording in progress'));
        return;
      }

      if (this.timerId !== null) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      const finalDuration = this.recordedDuration;

      this.mediaRecorder.onstop = async () => {
        try {
          if (this.audioChunks.length === 0) {
            throw new Error('No audio data recorded');
          }

          const finalBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/webm'
          });

          console.log('[AudioRecorder] Recording stopped:', {
            blobSize: finalBlob.size,
            duration: finalDuration,
            chunks: this.audioChunks.length,
            mimeType: finalBlob.type
          });

          this.cleanup();
          resolve({ blob: finalBlob, duration: finalDuration });
        } catch (error) {
          console.error('[AudioRecorder] Error finalizing recording:', error);
          reject(error);
        }
      };

      try {
        this.mediaRecorder.stop();
        this.isRecording = false;
      } catch (error) {
        console.error('[AudioRecorder] Error stopping MediaRecorder:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.pause();
        if (this.timerId !== null) {
          clearInterval(this.timerId);
          this.timerId = null;
        }
        console.log('[AudioRecorder] Recording paused at:', this.recordedDuration);
      } catch (error) {
        console.error('[AudioRecorder] Error pausing recording:', error);
      }
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder) {
      try {
        this.mediaRecorder.resume();
        // Resume duration tracking
        this.startTime = Date.now() - (this.recordedDuration * 1000);
        this.timerId = window.setInterval(() => {
          this.recordedDuration = (Date.now() - this.startTime) / 1000;
        }, 100);
        console.log('[AudioRecorder] Recording resumed from:', this.recordedDuration);
      } catch (error) {
        console.error('[AudioRecorder] Error resuming recording:', error);
      }
    }
  }

  private cleanup() {
    console.log('[AudioRecorder] Cleaning up resources');
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try {
          console.log('[AudioRecorder] Stopping track:', track.label);
          track.stop();
        } catch (error) {
          console.error('[AudioRecorder] Error stopping track:', error);
        }
      });
      this.stream = null;
    }
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordedDuration = 0;
    console.log('[AudioRecorder] Cleanup complete');
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentDuration(): number {
    return this.recordedDuration;
  }
}
