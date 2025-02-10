
interface RecordingResult {
  blob: Blob;
  duration: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private startTime: number = 0;
  private recordedDuration: number = 0;
  private timerId: number | null = null;

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.log('[AudioRecorder] Already recording');
      return;
    }

    try {
      this.audioChunks = [];
      this.stream = stream;
      this.recordedDuration = 0;
      
      // Configure MediaRecorder with specific MIME type and bitrate
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000 // 128kbps for good audio quality
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start tracking duration
      this.startTime = Date.now();
      this.timerId = window.setInterval(() => {
        this.recordedDuration = (Date.now() - this.startTime) / 1000;
      }, 100);

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      console.log('[AudioRecorder] Recording started with options:', options);
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.stream) {
        reject(new Error('No recording in progress'));
        return;
      }

      // Stop duration tracking
      if (this.timerId !== null) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Create a new blob with proper metadata
          const finalBlob = new Blob(this.audioChunks, { 
            type: 'audio/webm;codecs=opus'
          });

          // Get the precise duration
          const duration = this.recordedDuration;
          
          console.log('[AudioRecorder] Recording stopped:', {
            blobSize: finalBlob.size,
            duration,
            chunks: this.audioChunks.length,
            mimeType: finalBlob.type
          });

          this.cleanup();
          resolve({ blob: finalBlob, duration });
        } catch (error) {
          console.error('[AudioRecorder] Error finalizing recording:', error);
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      if (this.timerId !== null) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      console.log('[AudioRecorder] Recording paused at:', this.recordedDuration);
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.resume();
      // Resume duration tracking
      this.startTime = Date.now() - (this.recordedDuration * 1000);
      this.timerId = window.setInterval(() => {
        this.recordedDuration = (Date.now() - this.startTime) / 1000;
      }, 100);
      console.log('[AudioRecorder] Recording resumed from:', this.recordedDuration);
    }
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordedDuration = 0;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentDuration(): number {
    return this.recordedDuration;
  }
}
