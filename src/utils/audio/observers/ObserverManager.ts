
import { RecordingEvent, RecordingObserver } from '../types/audioRecorderTypes';

export class ObserverManager {
  private observers: Set<RecordingObserver> = new Set();

  addObserver(observer: RecordingObserver): void {
    this.observers.add(observer);
    console.log('[ObserverManager] Observer added, total observers:', this.observers.size);
  }

  removeObserver(observer: RecordingObserver): void {
    this.observers.delete(observer);
    console.log('[ObserverManager] Observer removed, total observers:', this.observers.size);
  }

  notifyObservers(event: RecordingEvent): void {
    this.observers.forEach(observer => {
      try {
        observer.update(event);
      } catch (error) {
        console.error('[ObserverManager] Error in observer notification:', error);
      }
    });
  }

  clearObservers(): void {
    this.observers.clear();
  }
}
