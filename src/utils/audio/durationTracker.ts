
export class DurationTracker {
  private startTime: number = 0;
  private recordedDuration: number = 0;
  private timerId: number | null = null;
  private isTracking: boolean = false;

  startTracking(): void {
    this.startTime = Date.now();
    this.isTracking = true;
    this.startInterval();
    console.log('[DurationTracker] Started tracking at:', new Date(this.startTime).toISOString());
  }

  private startInterval(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
    
    this.timerId = window.setInterval(() => {
      if (this.isTracking) {
        this.recordedDuration = (Date.now() - this.startTime) / 1000;
      }
    }, 100);
  }

  pauseTracking(): void {
    this.isTracking = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    console.log('[DurationTracker] Paused at duration:', this.recordedDuration.toFixed(1), 'seconds');
  }

  resumeTracking(): void {
    this.startTime = Date.now() - (this.recordedDuration * 1000);
    this.isTracking = true;
    this.startInterval();
    console.log('[DurationTracker] Resumed tracking from:', this.recordedDuration.toFixed(1), 'seconds');
  }

  stopTracking(): void {
    this.pauseTracking();
    console.log('[DurationTracker] Stopped tracking. Final duration:', this.recordedDuration.toFixed(1), 'seconds');
  }

  getCurrentDuration(): number {
    return this.isTracking 
      ? (Date.now() - this.startTime) / 1000
      : this.recordedDuration;
  }

  cleanup(): void {
    this.pauseTracking();
    this.recordedDuration = 0;
    this.isTracking = false;
    console.log('[DurationTracker] Reset duration tracker');
  }
}
