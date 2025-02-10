
import { RecordingResult, RecordingEvent, RecordingObserver } from './types';
import { getMediaRecorderOptions } from './recordingConfig';
import { logAudioTracks, validateAudioTracks, stopMediaTracks } from './recordingHelpers';

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private startTime: number = 0;
  private recordedDuration: number = 0;
  private timerId: number | null = null;
  private observers: Set<RecordingObserver> = new Set();
  private boundStreamInactiveHandler: (() => void) | null = null;

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
      logAudioTracks(stream);
      validateAudioTracks(stream);

      this.audioChunks = [];
      this.stream = stream;
      this.recordedDuration = 0;
      
      const options = getMediaRecorderOptions();
      console.log('[AudioRecorder] Creating MediaRecorder with options:', options);
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.setupMediaRecorderEvents();
      this.setupStreamInactiveHandler();

      this.startTime = Date.now();
      this.startDurationTracking();

      this.mediaRecorder.start(250);
      this.isRecording = true;
      
      this.notifyObservers({ type: 'start' });
      console.log('[AudioRecorder] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.notifyObservers({ 
        type: 'error', 
        data: { error: error instanceof Error ? error : new Error('Unknown error') } 
      });
      this.cleanup();
      throw error;
    }
  }

  private setupStreamInactiveHandler(): void {
    if (!this.stream) return;

    // Remove any existing handler
    if (this.boundStreamInactiveHandler) {
      this.stream.removeEventListener('inactive', this.boundStreamInactiveHandler);
    }

    // Create and bind new handler
    this.boundStreamInactiveHandler = () => {
      console.log('[AudioRecorder] Stream became inactive');
      if (this.isRecording) {
        this.stopRecording().catch(error => {
          console.error('[AudioRecorder] Error handling inactive stream:', error);
        });
      }
    };

    this.stream.addEventListener('inactive', this.boundStreamInactiveHandler);
  }

  private startDurationTracking(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
    
    this.timerId = window.setInterval(() => {
      if (!this.isRecording || !this.mediaRecorder) return;
      this.recordedDuration = (Date.now() - this.startTime) / 1000;
    }, 100);
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      const eventData = {
        dataSize: event.data?.size,
        dataType: event.data?.type,
        timeStamp: event.timeStamp
      };
      console.log('[AudioRecorder] Data available event:', eventData);

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

  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.stream || !this.isRecording) {
        reject(new Error('No recording in progress'));
        return;
      }

      if (this.timerId !== null) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      const finalDuration = Math.round(this.recordedDuration * 1000); // Convert to milliseconds

      const handleStop = () => {
        try {
          if (this.audioChunks.length === 0) {
            throw new Error('No audio data recorded');
          }

          const finalBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/webm'
          });

          const stats = {
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
          reject(error);
        }
      };

      try {
        this.mediaRecorder.onstop = handleStop;
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
        this.notifyObservers({ type: 'pause' });
      } catch (error) {
        console.error('[AudioRecorder] Error pausing recording:', error);
        this.notifyObservers({ 
          type: 'error',
          data: { error: error instanceof Error ? error : new Error('Error pausing recording') }
        });
      }
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder) {
      try {
        this.mediaRecorder.resume();
        this.startTime = Date.now() - (this.recordedDuration * 1000);
        this.startDurationTracking();
        console.log('[AudioRecorder] Recording resumed from:', this.recordedDuration);
        this.notifyObservers({ type: 'resume' });
      } catch (error) {
        console.error('[AudioRecorder] Error resuming recording:', error);
        this.notifyObservers({ 
          type: 'error',
          data: { error: error instanceof Error ? error : new Error('Error resuming recording') }
        });
      }
    }
  }

  private cleanup() {
    console.log('[AudioRecorder] Cleaning up resources');
    if (this.stream) {
      if (this.boundStreamInactiveHandler) {
        this.stream.removeEventListener('inactive', this.boundStreamInactiveHandler);
        this.boundStreamInactiveHandler = null;
      }
      stopMediaTracks(this.stream);
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
