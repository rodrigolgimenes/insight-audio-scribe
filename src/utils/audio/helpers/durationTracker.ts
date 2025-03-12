
/**
 * Tracks recording duration with pause/resume capability
 */
export class DurationTracker {
  private startTime: number = 0;
  private pausedAt: number = 0;
  private totalPausedTime: number = 0;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private timerId: number | null = null;

  /**
   * Starts tracking recording duration
   */
  startTracking(): void {
    if (this.isActive) {
      console.warn('[DurationTracker] Already tracking, resetting');
      this.cleanup();
    }
    
    this.startTime = Date.now();
    this.totalPausedTime = 0;
    this.isActive = true;
    this.isPaused = false;
    
    console.log('[DurationTracker] Started tracking at:', new Date(this.startTime).toISOString());
  }

  /**
   * Pauses duration tracking
   */
  pauseTracking(): void {
    if (!this.isActive || this.isPaused) return;
    
    this.pausedAt = Date.now();
    this.isPaused = true;
    
    console.log('[DurationTracker] Paused at duration:', this.getCurrentDuration().toFixed(1), 'seconds');
  }

  /**
   * Resumes duration tracking
   */
  resumeTracking(): void {
    if (!this.isActive || !this.isPaused) return;
    
    // Add the time spent in pause to totalPausedTime
    const pauseDuration = Date.now() - this.pausedAt;
    this.totalPausedTime += pauseDuration;
    this.isPaused = false;
    
    console.log('[DurationTracker] Resumed tracking. Pause duration:', (pauseDuration / 1000).toFixed(1), 'seconds');
  }

  /**
   * Stops tracking and returns final duration
   */
  stopTracking(): number {
    if (!this.isActive) return 0;
    
    const finalDuration = this.getCurrentDuration();
    this.isActive = false;
    
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    console.log('[DurationTracker] Stopped tracking. Final duration:', finalDuration.toFixed(1), 'seconds');
    return finalDuration;
  }

  /**
   * Gets current duration in seconds
   */
  getCurrentDuration(): number {
    if (!this.isActive) return 0;
    
    if (this.isPaused) {
      // If paused, calculate duration up to pause point
      return (this.pausedAt - this.startTime - this.totalPausedTime) / 1000;
    } else {
      // If active, calculate current duration accounting for paused time
      return (Date.now() - this.startTime - this.totalPausedTime) / 1000;
    }
  }

  /**
   * Cleans up and resets all state
   */
  cleanup(): void {
    this.isActive = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedAt = 0;
    this.totalPausedTime = 0;
    
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    console.log('[DurationTracker] Reset duration tracker');
  }
}
