
import type { Json } from './base';

export interface ContentTables {
  notes: {
    Row: {
      id: string
      user_id: string
      recording_id: string
      title: string
      processed_content: string
      original_transcript: string | null
      created_at: string
      updated_at: string
      status: string
      processing_progress: number
      duration: number | null
      audio_url: string | null
      error_message: string | null
      full_prompt: string | null
    }
    Insert: {
      id?: string
      user_id: string
      recording_id: string
      title: string
      processed_content: string
      original_transcript?: string | null
      created_at?: string
      updated_at?: string
      status?: string
      processing_progress?: number
      duration?: number | null
      audio_url?: string | null
      error_message?: string | null
      full_prompt?: string | null
    }
    Update: {
      id?: string
      user_id?: string
      recording_id?: string
      title?: string
      processed_content?: string
      original_transcript?: string | null
      created_at?: string
      updated_at?: string
      status?: string
      processing_progress?: number
      duration?: number | null
      audio_url?: string | null
      error_message?: string | null
      full_prompt?: string | null
    }
  }
  recordings: {
    Row: {
      id: string
      user_id: string
      title: string
      duration: number | null
      file_path: string
      created_at: string
      updated_at: string
      processed_at: string | null
      audio_url: string | null
      transcription: string | null
      processed_content: string | null
      status: string | null
      processed_audio_url: string | null
      original_file_type: string | null
      needs_audio_extraction: boolean | null
      original_file_path: string | null
      error_message: string | null
    }
    Insert: {
      id?: string
      user_id: string
      title: string
      duration?: number | null
      file_path: string
      created_at?: string
      updated_at?: string
      processed_at?: string | null
      audio_url?: string | null
      transcription?: string | null
      processed_content?: string | null
      status?: string | null
      processed_audio_url?: string | null
      original_file_type?: string | null
      needs_audio_extraction?: boolean | null
      original_file_path?: string | null
      error_message?: string | null
    }
    Update: {
      id?: string
      user_id?: string
      title?: string
      duration?: number | null
      file_path?: string
      created_at?: string
      updated_at?: string
      processed_at?: string | null
      audio_url?: string | null
      transcription?: string | null
      processed_content?: string | null
      status?: string | null
      processed_audio_url?: string | null
      original_file_type?: string | null
      needs_audio_extraction?: boolean | null
      original_file_path?: string | null
      error_message?: string | null
    }
    Relationships: []
  }
  processing_logs: {
    Row: {
      id: string
      recording_id: string
      note_id: string | null
      timestamp: string
      stage: string
      message: string
      details: Json | null
      status: string
      visible_to_user: boolean
    }
    Insert: {
      id?: string
      recording_id: string
      note_id?: string | null
      timestamp?: string
      stage: string
      message: string
      details?: Json | null
      status?: string
      visible_to_user?: boolean
    }
    Update: {
      id?: string
      recording_id?: string
      note_id?: string | null
      timestamp?: string
      stage?: string
      message?: string
      details?: Json | null
      status?: string
      visible_to_user?: boolean
    }
    Relationships: [
      {
        foreignKeyName: "processing_logs_recording_id_fkey"
        columns: ["recording_id"]
        isOneToOne: false
        referencedRelation: "recordings"
        referencedColumns: ["id"]
      },
      {
        foreignKeyName: "processing_logs_note_id_fkey"
        columns: ["note_id"]
        isOneToOne: false
        referencedRelation: "notes"
        referencedColumns: ["id"]
      }
    ]
  }
  styles: {
    Row: {
      id: string
      name: string
      description: string | null
      prompt_template: string
      category: string | null
      user_id: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      description?: string | null
      prompt_template: string
      category?: string | null
      user_id: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      description?: string | null
      prompt_template?: string
      category?: string | null
      user_id?: string
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
}
