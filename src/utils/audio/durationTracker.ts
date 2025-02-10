
export class DurationTracker {
  private startTime: number = 0;
  private recordedDuration: number = 0;
  private timerId: number | null = null;

  startTracking(): void {
    this.startTime = Date.now();
    this.startInterval();
  }

  private startInterval(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
    
    this.timerId = window.setInterval(() => {
      this.recordedDuration = (Date.now() - this.startTime) / 1000;
    }, 100);
  }

  pauseTracking(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  resumeTracking(): void {
    this.startTime = Date.now() - (this.recordedDuration * 1000);
    this.startInterval();
  }

  stopTracking(): void {
    this.pauseTracking();
  }

  getCurrentDuration(): number {
    return this.recordedDuration;
  }

  cleanup(): void {
    this.pauseTracking();
    this.recordedDuration = 0;
  }
}
