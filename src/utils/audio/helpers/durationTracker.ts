
export class DurationTracker {
  private startTime: number = 0;
  private recordedDuration: number = 0;
  private timerId: number | null = null;
  private active: boolean = false;

  /**
   * Starts tracking recording duration
   */
  start(): void {
    this.startTime = Date.now();
    this.recordedDuration = 0;
    this.active = true;
    
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
    
    this.timerId = window.setInterval(() => {
      if (this.active) {
        this.recordedDuration = (Date.now() - this.startTime) / 1000;
      }
    }, 100);
    
    console.log('[DurationTracker] Started at:', new Date(this.startTime).toISOString());
  }

  /**
   * Pauses the duration tracking
   */
  pause(): void {
    this.active = false;
    console.log('[DurationTracker] Paused at:', this.recordedDuration);
  }

  /**
   * Resumes the duration tracking
   */
  resume(): void {
    // Adjust start time to account for already recorded duration
    this.startTime = Date.now() - (this.recordedDuration * 1000);
    this.active = true;
    console.log('[DurationTracker] Resumed from:', this.recordedDuration);
  }

  /**
   * Stops tracking and returns final duration
   * @returns The final duration in seconds
   */
  stop(): number {
    this.active = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    console.log('[DurationTracker] Stopped at:', this.recordedDuration);
    return this.recordedDuration;
  }

  /**
   * Gets the current duration
   * @returns Current duration in seconds
   */
  getCurrentDuration(): number {
    return this.recordedDuration;
  }

  /**
   * Cleans up resources
   */
  cleanup(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.active = false;
    this.recordedDuration = 0;
    console.log('[DurationTracker] Reset');
  }
}
