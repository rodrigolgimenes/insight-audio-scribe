import { Note } from "@/integrations/supabase/types/notes";
import { MeetingMinutes } from "./MeetingMinutes";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { ProcessedContentAccordion } from "./ProcessedContentAccordion";
import { TitleSection } from "./TitleSection";
import { TranscriptValidation } from "./TranscriptValidation";
import { TranscriptError } from "./TranscriptError";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  console.log('NoteContent - Dados da nota recebidos:', {
    noteId: note.id,
    hasOriginalTranscript: !!note.original_transcript,
    originalTranscriptLength: note.original_transcript?.length,
    hasProcessedContent: !!note.processed_content,
    processedContentLength: note.processed_content?.length,
    fullNote: note
  });

  const { validTranscript } = TranscriptValidation({ note });

  return (
    <div className="space-y-8">
      <TitleSection note={note} />

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ata da Reunião</h2>
        <MeetingMinutes transcript={note.original_transcript} noteId={note.id} />
      </div>

      <ProcessedContentAccordion content={note.processed_content} />

      {validTranscript ? (
        <>
          <TranscriptAccordion transcript={validTranscript} />
          <TranscriptChat 
            transcript={validTranscript} 
            key={note.id}
          />
        </>
      ) : (
        <TranscriptError />
      )}
    </div>
  );
};