
import { Note } from "@/integrations/supabase/types/notes";

interface TranscriptValidationProps {
  note: Note;
}

export const TranscriptValidation = ({ note }: TranscriptValidationProps) => {
  const getTranscriptWithoutFirstLine = (transcript: string | null): string => {
    if (!transcript) {
      console.log('TranscriptValidation - Transcript not found:', { 
        noteId: note.id,
        transcript: 'null'
      });
      return '';
    }

    console.log('TranscriptValidation - Processing transcript:', {
      noteId: note.id,
      transcriptLength: transcript.length,
      transcriptPreview: transcript.substring(0, 100) + '...'
    });

    return transcript;
  };

  const processTranscript = (transcript: string): string => {
    if (!transcript.trim()) {
      return '';
    }

    return transcript;
  };

  // First check processed content, then original transcript
  const transcript = note.processed_content || note.original_transcript;
  const transcriptWithoutFirstLine = getTranscriptWithoutFirstLine(transcript);
  const processedTranscript = processTranscript(transcriptWithoutFirstLine);
  const validTranscript = processedTranscript;

  console.log('TranscriptValidation - Final processing result:', {
    noteId: note.id,
    hasValidTranscript: !!validTranscript,
    processedTranscriptLength: processedTranscript.length,
    willShowTranscript: !!validTranscript,
    transcriptPreview: validTranscript ? validTranscript.substring(0, 100) : 'N/A'
  });

  return { validTranscript };
};
