
export interface Note {
  id: string;
  title: string;
  processed_content: string | null;
  original_transcript: string | null;
  full_prompt: string | null;
  created_at: string;
  updated_at: string;
  recording_id: string;
  user_id: string;
  duration: number | null;
  audio_url: string | null;
  status?: 'processing' | 'completed' | 'error';
  processing_progress?: number;
  folder?: {
    folder_id: string;
  } | null;
  recordings?: {
    duration: number;
  };
  notes_tags?: {
    tags: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}
