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
    if (!transcript) {
      console.log('NoteContent - Transcrição não encontrada:', { noteId: note.id });
      return '';
    }
    console.log('NoteContent - Processando transcrição:', {
      noteId: note.id,
      transcriptLength: transcript.length,
      firstLine: transcript.split('\n')[0]
    });
    
    const lines = transcript.split('\n');
    const processedTranscript = lines.slice(1).join('\n');
    
    console.log('NoteContent - Transcrição processada:', {
      noteId: note.id,
      processedLength: processedTranscript.length,
      hasContent: !!processedTranscript
    });
    
    return processedTranscript;
  };

  // Processa a transcrição uma única vez
  const processedTranscript = getTranscriptWithoutFirstLine(note.original_transcript);

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
      {processedTranscript ? (
        <>
          <TranscriptAccordion transcript={processedTranscript} />
          <TranscriptChat transcript={processedTranscript} />
        </>
      ) : (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">
            Não foi possível encontrar a transcrição para este documento.
          </p>
        </div>
      )}
    </div>
  );
};