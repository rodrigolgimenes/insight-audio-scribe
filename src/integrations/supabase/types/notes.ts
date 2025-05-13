
export interface Note {
  id: string;
  title: string | null;
  processed_content: string | null;
  original_transcript: string | null;
  full_prompt?: string | null;
  created_at: string;
  updated_at: string;
  recording_id: string;
  user_id: string;
  duration: number | null;
  audio_url: string | null;
  status: 'pending' | 'processing' | 'transcribing' | 'generating_minutes' | 'completed' | 'error' | 'failed';
  processing_progress?: number;
  error_message?: string | null;
  tags?: any[];
}
