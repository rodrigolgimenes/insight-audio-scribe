
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

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      this.audioChunks = [];
      this.stream = stream;
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
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

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        const duration = Math.round((Date.now() - this.startTime) / 1000); // Duration in seconds
        this.cleanup();
        resolve({ blob: audioBlob, duration });
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('Recording stopped');
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      console.log('Recording paused');
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.resume();
      console.log('Recording resumed');
    }
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}
