
import { BaseRecorder } from './core/BaseRecorder';
import type { IAudioRecorder } from './interfaces/IAudioRecorder';

// Extend the BaseRecorder to implement our interface
export class AudioRecorder extends BaseRecorder implements IAudioRecorder {
  constructor() {
    super();
  }
  
  // Implementing the interface methods explicitly
  startRecording(stream: MediaStream): Promise<void> {
    return super.startRecording(stream);
  }
  
  stopRecording(): Promise<any> {
    return super.stopRecording();
  }
  
  pauseRecording(): void {
    super.pauseRecording();
  }
  
  resumeRecording(): void {
    super.resumeRecording();
  }
  
  isCurrentlyRecording(): boolean {
    return super.isCurrentlyRecording();
  }
  
  isPausedState(): boolean {
    return super.isPausedState();
  }
  
  getCurrentDuration(): number {
    return super.getCurrentDuration();
  }
  
  getFinalBlob(): Blob | null {
    return super.getFinalBlob();
  }
}
