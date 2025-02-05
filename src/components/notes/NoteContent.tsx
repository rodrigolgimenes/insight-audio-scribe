import { Note } from "@/integrations/supabase/types/notes";
import { MeetingMinutes } from "./MeetingMinutes";

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
      {/* Main content section */}
      <div className="prose max-w-none">
        <h1 className="text-3xl font-bold mb-6">{note.title}</h1>
        <p className="text-gray-600 mb-4">{extractTitleAndDateTime(note.original_transcript)}</p>
        <div className="mb-8" dangerouslySetInnerHTML={{ __html: note.processed_content }} />
      </div>

      {/* Meeting Minutes section - Now first */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ata da Reunião</h2>
        <MeetingMinutes transcript={note.original_transcript} noteId={note.id} />
      </div>

      {/* Original transcript section - Now second */}
      {note.original_transcript && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Original Transcript</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-4">
              This is the automated transcription. It may contain errors.
            </p>
            <div className="whitespace-pre-wrap text-gray-700">
              {getTranscriptWithoutFirstLine(note.original_transcript)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};