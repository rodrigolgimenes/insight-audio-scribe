
import { RecordingEvent, RecordingObserver } from '../types';

/**
 * Implements the observer pattern for recording events
 */
export class ObserverManager {
  private observers: Set<RecordingObserver> = new Set();

  /**
   * Adds an observer to the notification list
   */
  addObserver(observer: RecordingObserver): void {
    this.observers.add(observer);
  }

  /**
   * Removes an observer from the notification list
   */
  removeObserver(observer: RecordingObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Notifies all registered observers about an event
   */
  notifyObservers(event: RecordingEvent): void {
    this.observers.forEach(observer => observer.update(event));
  }

  /**
   * Clears all observers
   */
  clearObservers(): void {
    this.observers.clear();
  }
}
