export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTime: number | null = null;

  async startRecording(useSystemAudio: boolean = false) {
    try {
      let stream;
      
      if (useSystemAudio) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: false
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      this.chunks = [];
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.lastPauseTime = null;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = Math.floor(
          (Date.now() - this.startTime - this.pausedDuration) / 1000
        );
        
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        
        // Stop all tracks in the stream
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        
        resolve({ blob, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  pauseRecording() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.lastPauseTime = Date.now();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      if (this.lastPauseTime) {
        this.pausedDuration += Date.now() - this.lastPauseTime;
        this.lastPauseTime = null;
      }
    }
  }
}