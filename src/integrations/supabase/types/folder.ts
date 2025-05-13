
import { User } from './auth';

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface NoteFolder {
  note_id: string;
  folder_id: string;
  created_at: string;
}
