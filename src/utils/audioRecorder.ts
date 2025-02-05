export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTime: number | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private silenceThreshold = -50; // dB
  private silenceTime = 0;
  private minSilenceDuration = 1000; // 1 second
  private isRecordingNoise = false;

  async startRecording(useSystemAudio: boolean = false) {
    try {
      this.audioContext = new AudioContext();
      let stream;
      
      if (useSystemAudio) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
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

      // Set up audio processing
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.sourceNode.connect(this.analyserNode);

      // Create a processed stream
      const destination = this.audioContext.createMediaStreamDestination();
      this.analyserNode.connect(destination);

      this.mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm'
      });

      this.chunks = [];
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.lastPauseTime = null;
      this.silenceTime = 0;
      this.isRecordingNoise = false;

      // Monitor audio levels
      this.monitorAudioLevels();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && !this.isRecordingNoise) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100); // Record in 100ms chunks
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  private monitorAudioLevels() {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    const checkLevel = () => {
      if (!this.analyserNode || !this.mediaRecorder) return;

      this.analyserNode.getFloatFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (average < this.silenceThreshold) {
        if (!this.isRecordingNoise) {
          this.silenceTime = Date.now();
          this.isRecordingNoise = true;
        } else if (Date.now() - this.silenceTime > this.minSilenceDuration) {
          // If silence persists, pause recording
          if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
          }
        }
      } else {
        this.isRecordingNoise = false;
        if (this.mediaRecorder.state === 'paused') {
          this.mediaRecorder.resume();
        }
      }

      if (this.mediaRecorder.state !== 'inactive') {
        requestAnimationFrame(checkLevel);
      }
    };

    requestAnimationFrame(checkLevel);
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
        
        // Clean up audio context and nodes
        if (this.sourceNode) {
          this.sourceNode.disconnect();
          this.sourceNode = null;
        }
        if (this.analyserNode) {
          this.analyserNode.disconnect();
          this.analyserNode = null;
        }
        if (this.audioContext) {
          this.audioContext.close();
          this.audioContext = null;
        }
        
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