
import { RecordingEvent } from '../types';
import { ObserverManager } from '../observers/ObserverManager';

/**
 * Handles MediaRecorder events and notifies observers
 */
export class MediaRecorderEvents {
  constructor(private observerManager: ObserverManager) {}

  /**
   * Sets up event handlers for a MediaRecorder instance
   */
  setupEvents(mediaRecorder: MediaRecorder, onDataAvailable: (event: BlobEvent) => void): void {
    if (!mediaRecorder) return;

    mediaRecorder.ondataavailable = (event) => {
      console.log('[MediaRecorderEvents] Data available event:', {
        dataSize: event.data?.size,
        dataType: event.data?.type,
        timeStamp: event.timeStamp
      });

      if (event.data && event.data.size > 0) {
        onDataAvailable(event);
        this.observerManager.notifyObservers({ 
          type: 'dataAvailable', 
          data: { chunk: event.data } 
        });
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('[MediaRecorderEvents] MediaRecorder error:', event);
      this.observerManager.notifyObservers({ 
        type: 'error', 
        data: { error: new Error('MediaRecorder error') } 
      });
    };

    mediaRecorder.onstart = () => {
      console.log('[MediaRecorderEvents] MediaRecorder started');
      this.observerManager.notifyObservers({ type: 'start' });
    };

    mediaRecorder.onpause = () => {
      console.log('[MediaRecorderEvents] MediaRecorder paused');
      this.observerManager.notifyObservers({ type: 'pause' });
    };

    mediaRecorder.onresume = () => {
      console.log('[MediaRecorderEvents] MediaRecorder resumed');
      this.observerManager.notifyObservers({ type: 'resume' });
    };

    mediaRecorder.onstop = () => {
      console.log('[MediaRecorderEvents] MediaRecorder stopped');
      this.observerManager.notifyObservers({ type: 'stop' });
    };
  }
}
