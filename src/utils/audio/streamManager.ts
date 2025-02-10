
import { stopMediaTracks } from './recordingHelpers';

export class StreamManager {
  private stream: MediaStream | null = null;
  private boundStreamInactiveHandler: (() => void) | null = null;

  initialize(stream: MediaStream, onInactive: () => void): void {
    this.stream = stream;
    this.setupInactiveHandler(onInactive);
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

  cleanup(): void {
    if (this.stream) {
      if (this.boundStreamInactiveHandler) {
        this.stream.removeEventListener('inactive', this.boundStreamInactiveHandler);
        this.boundStreamInactiveHandler = null;
      }
      stopMediaTracks(this.stream);
      this.stream = null;
    }
  }
}
