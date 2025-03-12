
export interface RecordingResult {
  blob: Blob;
  duration: number;
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
