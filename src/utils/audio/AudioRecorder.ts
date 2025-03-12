
import { RecordingResult } from './types';
import { BaseRecorder } from './core/BaseRecorder';

export class AudioRecorder extends BaseRecorder {
  constructor() {
    super();
  }

  // Add methods required by useSaveDeleteRecording.ts
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getFinalBlob(): Blob | null {
    return this.latestBlob || (this.mediaRecorderManager ? this.mediaRecorderManager.getFinalBlob() : null);
  }
}
