
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
    }
    Insert: {
      id?: string
      user_id: string
      title: string
      duration?: number | null
      file_path: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      title?: string
      duration?: number | null
      file_path?: string
      created_at?: string
      updated_at?: string
    }
    Relationships: []
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
