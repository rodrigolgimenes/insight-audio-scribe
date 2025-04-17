
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  duration: number;
  error: string | null;
}

export interface RecordingOptions {
  deviceId: string | null;
  isSystemAudio: boolean;
  sampleRate?: number;
  sampleSize?: number;
}

export interface RecordingResult {
  blob: Blob | null;
  duration: number;
  error?: string;
}
