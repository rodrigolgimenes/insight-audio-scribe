
import { stopMediaTracks } from './recordingHelpers';

export class StreamManager {
  private stream: MediaStream | null = null;
  private boundStreamInactiveHandler: (() => void) | null = null;
  private boundStreamErrorHandler: ((event: Event) => void) | null = null;

  initialize(stream: MediaStream, onInactive: () => void): void {
    this.cleanup(); // Ensure any previous stream is properly cleaned up
    
    this.stream = stream;
    this.setupInactiveHandler(onInactive);
    this.setupErrorHandler();
    
    console.log('[StreamManager] Initialized with stream ID:', stream.id);
  }

  private setupInactiveHandler(onInactive: () => void): void {
    if (!this.stream) return;

    if (this.boundStreamInactiveHandler) {
      this.stream.removeEventListener('inactive', this.boundStreamInactiveHandler);
    }

    this.boundStreamInactiveHandler = () => {
      console.log('[StreamManager] Stream became inactive');
      onInactive();
    };

    this.stream.addEventListener('inactive', this.boundStreamInactiveHandler);
  }
  
  private setupErrorHandler(): void {
    if (!this.stream) return;
    
    const tracks = this.stream.getTracks();
    
    this.boundStreamErrorHandler = (event: Event) => {
      console.error('[StreamManager] Track error event:', event);
    };
    
    tracks.forEach(track => {
      track.addEventListener('error', this.boundStreamErrorHandler as EventListener);
    });
  }

  cleanup(): void {
    if (this.stream) {
      if (this.boundStreamInactiveHandler) {
        this.stream.removeEventListener('inactive', this.boundStreamInactiveHandler);
        this.boundStreamInactiveHandler = null;
      }
      
      if (this.boundStreamErrorHandler) {
        this.stream.getTracks().forEach(track => {
          track.removeEventListener('error', this.boundStreamErrorHandler as EventListener);
        });
        this.boundStreamErrorHandler = null;
      }
      
      stopMediaTracks(this.stream);
      this.stream = null;
      console.log('[StreamManager] Stream cleaned up and tracks stopped');
    }
  }
}
