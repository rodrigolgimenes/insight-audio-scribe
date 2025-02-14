
export interface RecordingData {
  id: string;
  file_path: string;
  status: string;
}

export interface NoteData {
  id: string;
  recording_id: string;
  status: string;
  processing_progress: number;
}

export interface TranscriptionResult {
  text: string;
}
