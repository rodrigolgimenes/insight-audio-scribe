
import { Note } from "@/types/notes";

export const transformNoteFromDB = (dbNote: any): Note => {
  return {
    id: dbNote.id,
    title: dbNote.title || '',
    processed_content: dbNote.processed_content || '',
    original_transcript: dbNote.original_transcript || null,
    full_prompt: dbNote.full_prompt || null,
    created_at: dbNote.created_at,
    updated_at: dbNote.updated_at || dbNote.created_at,
    recording_id: dbNote.recording_id || dbNote.id,
    user_id: dbNote.user_id || 'anonymous',
    duration: dbNote.duration || null,
    audio_url: dbNote.audio_url || null,
    status: dbNote.status || 'completed',
    processing_progress: dbNote.processing_progress || 100,
    error_message: dbNote.error_message || null,
    tags: dbNote.tags ? dbNote.tags.map((tag: any) => ({
      id: tag.id || '',
      name: tag.name || '',
      color: tag.color || null
    })) : []
  };
};

export const extractNoteTags = (note: Note) => {
  return note.tags || [];
};

export const getNoteAudioDuration = (note: Note): number => {
  return note.duration || 0;
};
