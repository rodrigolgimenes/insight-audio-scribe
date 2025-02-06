import { Note } from "@/integrations/supabase/types/notes";
import { MeetingMinutes } from "./MeetingMinutes";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { ProcessedContentAccordion } from "./ProcessedContentAccordion";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  // Função para extrair apenas o título e data/hora da primeira linha
  const extractTitleAndDateTime = (transcript: string | null): string => {
    if (!transcript) return '';
    const firstLine = transcript.split('\n')[0];
    const match = firstLine.match(/Recording (\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})/);
    return match ? `Recording ${match[1]}, ${match[2]}` : '';
  };

  // Função para remover a primeira linha da transcrição
  const getTranscriptWithoutFirstLine = (transcript: string | null): string => {
    if (!transcript) return '';
    const lines = transcript.split('\n');
    return lines.slice(1).join('\n');
  };

  return (
    <div className="space-y-8">
      {/* Title and date section */}
      <div className="prose max-w-none">
        <h1 className="text-3xl font-bold mb-6">{note.title}</h1>
        <p className="text-gray-600 mb-4">{extractTitleAndDateTime(note.original_transcript)}</p>
      </div>

      {/* Meeting Minutes section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ata da Reunião</h2>
        <MeetingMinutes transcript={note.original_transcript} noteId={note.id} />
      </div>

      {/* Processed content section with accordion */}
      <ProcessedContentAccordion content={note.processed_content} />

      {/* Transcript Accordion and Chat */}
      {note.original_transcript && (
        <>
          <TranscriptAccordion 
            transcript={getTranscriptWithoutFirstLine(note.original_transcript)} 
          />
          <TranscriptChat 
            transcript={getTranscriptWithoutFirstLine(note.original_transcript)} 
          />
        </>
      )}
    </div>
  );
};