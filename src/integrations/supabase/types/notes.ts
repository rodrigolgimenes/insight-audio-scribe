
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

export interface ClassificationResult {
  project_id: string;
  project_name: string;
  project_description: string | null;
  similarity_score: number;
  classification_reason: string;
  classification_method?: string;
  status: 'classified' | 'processed' | 'failed';
}

export interface ClassificationResponse {
  success: boolean;
  classifications: ClassificationResult[];
  count: number;
  error?: string;
  best_score?: number;
  threshold_used?: number;
}
