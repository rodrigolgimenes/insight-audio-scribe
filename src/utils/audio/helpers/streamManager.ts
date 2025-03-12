
/**
 * Manages MediaStream resources and lifecycle
 */
export class StreamManager {
  private activeStream: MediaStream | null = null;
  private onStreamInactive: (() => void) | null = null;

  /**
   * Initializes the manager with a stream and callback
   */
  initialize(stream: MediaStream, onStreamInactive?: () => void): void {
    this.cleanup(); // Clean up any existing stream
    
    this.activeStream = stream;
    this.onStreamInactive = onStreamInactive || null;
    
    // Set up listeners for track ended events
    if (stream && typeof onStreamInactive === 'function') {
      stream.getAudioTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.log('[StreamManager] Audio track ended');
          if (this.onStreamInactive) {
            this.onStreamInactive();
          }
        });
      });
    }
    
    console.log('[StreamManager] Initialized with stream:', { 
      id: stream.id,
      trackCount: stream.getTracks().length,
      active: stream.active
    });
  }

  /**
   * Gets the active stream
   */
  getStream(): MediaStream | null {
    return this.activeStream;
  }

  /**
   * Stops all tracks and releases resources
   */
  cleanup(): void {
    if (this.activeStream) {
      console.log('[StreamManager] Stopping all tracks');
      
      this.activeStream.getTracks().forEach(track => {
        track.stop();
      });
      
      this.activeStream = null;
      this.onStreamInactive = null;
    }
  }
}
