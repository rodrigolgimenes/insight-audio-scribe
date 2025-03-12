
import { BaseRecorder } from './core/BaseRecorder';
import type { IAudioRecorder } from './interfaces/IAudioRecorder';

// Extend the BaseRecorder to implement our interface
export class AudioRecorder extends BaseRecorder implements IAudioRecorder {
  constructor() {
    super();
  }
}
