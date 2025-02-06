import { Note } from "@/integrations/supabase/types/notes";
import { MeetingMinutes } from "./MeetingMinutes";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
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
    <div className="divide-y divide-gray-200">
      <div className="px-6 py-4">
        <TitleSection note={note} />
      </div>

      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ata da Reunião</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <MeetingMinutes transcript={note.original_transcript} noteId={note.id} />
        </div>
      </div>

      {validTranscript ? (
        <>
          <div className="px-6 py-4">
            <TranscriptAccordion transcript={validTranscript} />
          </div>
          <div className="px-6 py-4">
            <TranscriptChat 
              transcript={validTranscript} 
              key={note.id}
            />
          </div>
        </>
      ) : (
        <div className="px-6 py-4">
          <TranscriptError />
        </div>
      )}
    </div>
  );
};