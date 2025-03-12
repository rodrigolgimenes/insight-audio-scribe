
export class StreamManager {
  private stream: MediaStream | null = null;

  /**
   * Initializes the stream manager with a MediaStream
   * @param stream The MediaStream to manage
   * @param onInactive Optional callback when stream becomes inactive
   */
  initialize(stream: MediaStream, onInactive?: () => void): void {
    this.stream = stream;
    
    if (onInactive) {
      // Monitor stream for unexpected stops
      stream.addEventListener('inactive', () => {
        console.log('[StreamManager] Stream became inactive');
        if (onInactive) onInactive();
      });
    }
    
    console.log('[StreamManager] Stream initialized with', stream.getTracks().length, 'tracks');
  }

  /**
   * Stops all tracks in the managed stream and cleans up
   */
  cleanup(): void {
    if (this.stream) {
      console.log('[StreamManager] Stopping all tracks');
      this.stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.error('[StreamManager] Error stopping track:', error);
        }
      });
      this.stream = null;
    }
  }

  /**
   * Gets the current stream
   * @returns The current MediaStream or null
   */
  getStream(): MediaStream | null {
    return this.stream;
  }
}
