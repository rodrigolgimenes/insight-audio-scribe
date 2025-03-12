
import { RecordingResult, RecordingStats, RecordingEvent, RecordingObserver } from "../types/audioRecorderTypes";

export interface IAudioRecorder {
  addObserver(observer: RecordingObserver): void;
  removeObserver(observer: RecordingObserver): void;
  startRecording(stream: MediaStream): Promise<void>;
  stopRecording(): Promise<RecordingResult>;
  pauseRecording(): void;
  resumeRecording(): void;
  isCurrentlyRecording(): boolean;
  isPausedState?(): boolean;
  getCurrentDuration(): number;
  getFinalBlob(): Blob | null;
}
