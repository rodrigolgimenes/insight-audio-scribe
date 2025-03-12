
export interface RecordingResult {
  blob: Blob | null;
  stats: RecordingStats;
  duration?: number; // Added duration property
}

export interface AudioTrackInfo {
  label: string;
  enabled: boolean;
  muted: boolean;
  readyState: string;
}

export interface RecordingStats {
  blobSize: number;
  duration: number;
  chunks: number;
  mimeType: string;
}

export interface RecordingEvent {
  type: 'start' | 'stop' | 'pause' | 'resume' | 'dataAvailable' | 'error' | 'complete';
  data?: {
    chunk?: Blob;
    error?: Error;
    stats?: RecordingStats;
  };
}

export interface RecordingObserver {
  update(event: RecordingEvent): void;
}
