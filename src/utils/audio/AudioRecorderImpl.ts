
import { RecordingEvent, RecordingResult, RecordingStats } from './types/audioRecorderTypes';
import { IAudioRecorder } from './interfaces/IAudioRecorder';
import { ObserverManager } from './observers/ObserverManager';
import { MediaRecorderEvents } from './media/MediaRecorderEvents';
import { AudioChunksManager } from './media/AudioChunksManager';
import { DurationTracker } from './helpers/durationTracker';

export class AudioRecorderImpl implements IAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private startTime: number = 0;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private finalAudioBlob: Blob | null = null;
  private observerManager: ObserverManager;
  private chunksManager: AudioChunksManager;
  private mediaRecorderEvents: MediaRecorderEvents;
  private durationTracker: DurationTracker;

  constructor() {
    this.observerManager = new ObserverManager();
    this.chunksManager = new AudioChunksManager();
    this.mediaRecorderEvents = new MediaRecorderEvents(this.observerManager);
    this.durationTracker = new DurationTracker();
  }

  addObserver(observer: { update: (event: RecordingEvent) => void }): void {
    this.observerManager.addObserver(observer);
  }

  removeObserver(observer: { update: (event: RecordingEvent) => void }): void {
    this.observerManager.removeObserver(observer);
  }

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.warn('[AudioRecorderImpl] Recording already in progress');
      return;
    }

    try {
      console.log('[AudioRecorderImpl] Starting recording with stream:', stream);
      
      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in the provided stream');
      }
      
      // Log track info for debugging
      audioTracks.forEach((track, i) => {
        console.log(`[AudioRecorderImpl] Audio track ${i}:`, { 
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState 
        });
      });

      // Try to determine the best mime type
      const mimeType = this.getSupportedMimeType();
      console.log('[AudioRecorderImpl] Using mime type:', mimeType);
      this.chunksManager.setMimeType(mimeType);

      // Create media recorder with options
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      // Add event handlers
      this.mediaRecorderEvents.setupEvents(
        this.mediaRecorder,
        (event) => this.chunksManager.addChunk(event.data)
      );

      // Reset internal state
      this.isRecording = true;
      this.isPaused = false;
      this.finalAudioBlob = null;
      this.chunksManager.clearChunks();
      
      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();
      this.durationTracker.start();
      
      console.log('[AudioRecorderImpl] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorderImpl] Error starting recording:', error);
      this.isRecording = false;
      this.observerManager.notifyObservers({ 
        type: 'error', 
        data: { error: error instanceof Error ? error : new Error('Unknown error starting recording') } 
      });
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('[AudioRecorderImpl] No active recording to stop');
      return { 
        blob: null, 
        stats: { 
          blobSize: 0, 
          duration: 0, 
          chunks: 0, 
          mimeType: '' 
        }
      };
    }

    try {
      return new Promise<RecordingResult>((resolve) => {
        if (!this.mediaRecorder) {
          resolve({ 
            blob: null, 
            stats: { 
              blobSize: 0, 
              duration: 0, 
              chunks: 0, 
              mimeType: '' 
            }
          });
          return;
        }

        // When stop is complete, we'll resolve the promise with the final audio
        this.mediaRecorder.addEventListener('stop', () => {
          const duration = this.durationTracker.stop();
          this.isRecording = false;
          this.isPaused = false;
          
          const finalBlob = this.chunksManager.getFinalBlob();
          if (finalBlob) {
            this.finalAudioBlob = finalBlob;
          }
          
          const stats = this.chunksManager.getRecordingStats(duration);
          
          resolve({
            blob: this.finalAudioBlob,
            stats
          });
          
          this.observerManager.notifyObservers({
            type: 'complete',
            data: { stats }
          });
        }, { once: true });
        
        // Request the MediaRecorder to stop
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      });
    } catch (error) {
      console.error('[AudioRecorderImpl] Error stopping recording:', error);
      this.isRecording = false;
      this.isPaused = false;
      
      this.observerManager.notifyObservers({ 
        type: 'error', 
        data: { error: error instanceof Error ? error : new Error('Unknown error stopping recording') } 
      });
      
      return { 
        blob: null, 
        stats: { 
          blobSize: 0, 
          duration: this.getCurrentDuration(), 
          chunks: this.chunksManager.getChunkCount(), 
          mimeType: this.chunksManager.getMimeType() 
        }
      };
    }
  }

  pauseRecording(): void {
    if (!this.isRecording || !this.mediaRecorder || this.isPaused) {
      console.warn('[AudioRecorderImpl] Cannot pause: No active recording or already paused');
      return;
    }

    if (this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.pause();
        this.isPaused = true;
        this.durationTracker.pause();
        console.log('[AudioRecorderImpl] Recording paused');
      } catch (error) {
        console.error('[AudioRecorderImpl] Error pausing recording:', error);
        this.observerManager.notifyObservers({ 
          type: 'error', 
          data: { error: error instanceof Error ? error : new Error('Failed to pause recording') } 
        });
      }
    }
  }

  resumeRecording(): void {
    if (!this.isRecording || !this.mediaRecorder || !this.isPaused) {
      console.warn('[AudioRecorderImpl] Cannot resume: No active recording or not paused');
      return;
    }

    if (this.mediaRecorder.state === 'paused') {
      try {
        this.mediaRecorder.resume();
        this.isPaused = false;
        this.durationTracker.resume();
        console.log('[AudioRecorderImpl] Recording resumed');
      } catch (error) {
        console.error('[AudioRecorderImpl] Error resuming recording:', error);
        this.observerManager.notifyObservers({ 
          type: 'error', 
          data: { error: error instanceof Error ? error : new Error('Failed to resume recording') } 
        });
      }
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  getCurrentDuration(): number {
    return this.durationTracker.getCurrentDuration();
  }

  getFinalBlob(): Blob | null {
    return this.finalAudioBlob;
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
    ];
    
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    console.warn('[AudioRecorderImpl] No supported mime types found, falling back to audio/webm');
    return 'audio/webm';
  }
}
