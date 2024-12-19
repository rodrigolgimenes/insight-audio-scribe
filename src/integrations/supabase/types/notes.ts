import { Tables } from './database';

export type NoteRow = Tables<'notes'>;
export type NoteInsert = Tables<'notes'>['Insert'];
export type NoteUpdate = Tables<'notes'>['Update'];

export interface NoteWithRelations extends NoteRow {
  notes_tags?: { tag_id: string }[];
  notes_folders?: { folder_id: string }[];
}