
export class UploadProgressTracker {
  private totalBytes: number;
  private uploadedBytes: number = 0;
  private progressIntervalId?: number;
  private timeoutId?: number;

  constructor(totalBytes: number) {
    this.totalBytes = totalBytes;
  }

  startTracking(chunkSize: number) {
    console.log(`Starting upload progress tracking for ${(this.totalBytes / (1024 * 1024)).toFixed(2)}MB file`);
    
    // Clear any existing interval
    this.stopTracking();
    
    // Start new tracking interval
    this.progressIntervalId = window.setInterval(() => {
      this.uploadedBytes += chunkSize;
      
      if (this.uploadedBytes >= this.totalBytes) {
        this.uploadedBytes = this.totalBytes;
        this.stopTracking();
      }
      
      const percentComplete = Math.round((this.uploadedBytes / this.totalBytes) * 100);
      console.log(`Upload progress: ${percentComplete}%`);
    }, 1000);
    
    // Set a timeout to clear the interval after expected upload time
    // Rough estimate based on 500KB/s upload speed
    const estimatedUploadTime = (this.totalBytes / (500 * 1024)) * 1000;
    this.timeoutId = window.setTimeout(() => {
      this.stopTracking();
    }, estimatedUploadTime);
  }

  stopTracking() {
    if (this.progressIntervalId) {
      window.clearInterval(this.progressIntervalId);
      this.progressIntervalId = undefined;
    }
    
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
