
export interface Note {
  id: string;
  title: string;
  processed_content: string;
  original_transcript: string | null;
  full_prompt: string | null;
  created_at: string;
  updated_at: string;
  recording_id: string;
  user_id: string;
  duration: number | null;
  audio_url: string | null;
  folder?: {
    folder_id: string;
  } | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}
