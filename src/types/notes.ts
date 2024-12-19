export interface Note {
  id: string;
  title: string;
  processed_content: string;
  original_transcript: string | null;
  created_at: string;
  recording_id: string;
  user_id: string;
}