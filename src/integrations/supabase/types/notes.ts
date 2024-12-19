import { Tables, TablesInsert, TablesUpdate } from './database';

export type NoteRow = Tables<'notes'>;
export type NoteInsert = TablesInsert<'notes'>;
export type NoteUpdate = TablesUpdate<'notes'>;

export interface Note {
  id: string;
  user_id: string;
  recording_id: string;
  title: string;
  processed_content: string;
  original_transcript: string | null;
  full_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteWithRelations extends Note {
  notes_tags?: { tag_id: string }[];
  notes_folders?: { folder_id: string }[];
}