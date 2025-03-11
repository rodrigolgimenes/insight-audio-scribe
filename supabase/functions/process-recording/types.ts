
export interface ProcessRecordingRequest {
  recordingId: string;
  noteId?: string;
}

export interface RecordingData {
  id: string;
  title: string;
  status: string;
  user_id: string;
  duration?: number;
  file_path?: string;
  error_message?: string;
}

export interface NoteData {
  id: string;
  title: string;
  recording_id: string;
  user_id: string;
  status: string;
  duration?: number;
  processing_progress: number;
  error_message?: string;
}

export interface ProcessResponse {
  success: boolean;
  noteId?: string;
  error?: string;
  details?: string;
}
