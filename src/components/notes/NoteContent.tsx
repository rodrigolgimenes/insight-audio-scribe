import { Note } from "@/integrations/supabase/types/notes";
import { MeetingMinutes } from "./MeetingMinutes";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { ProcessedContentAccordion } from "./ProcessedContentAccordion";

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
    fullNote: note // Add full note logging for debugging
  });

  // Função para extrair apenas o título e data/hora da primeira linha
  const extractTitleAndDateTime = (transcript: string | null): string => {
    if (!transcript) {
      console.log('NoteContent - Erro ao extrair título: transcrição ausente');
      return '';
    }
    const firstLine = transcript.split('\n')[0];
    const match = firstLine.match(/Recording (\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})/);
    
    console.log('NoteContent - Extração de título:', {
      firstLine,
      hasMatch: !!match,
      extractedDateTime: match ? `Recording ${match[1]}, ${match[2]}` : ''
    });
    
    return match ? `Recording ${match[1]}, ${match[2]}` : '';
  };

  // Função para remover a primeira linha da transcrição e validar o conteúdo
  const getTranscriptWithoutFirstLine = (transcript: string | null): string => {
    if (!transcript) {
      console.log('NoteContent - Transcrição não encontrada:', { 
        noteId: note.id,
        transcriptValue: transcript,
        transcriptType: typeof transcript
      });
      return '';
    }

    if (typeof transcript !== 'string') {
      console.log('NoteContent - Tipo inválido de transcrição:', {
        noteId: note.id,
        transcriptType: typeof transcript,
        transcriptValue: transcript
      });
      return '';
    }

    console.log('NoteContent - Processando transcrição:', {
      noteId: note.id,
      transcriptLength: transcript.length,
      firstLine: transcript.split('\n')[0],
      transcriptPreview: transcript.substring(0, 100) // Add preview of content
    });
    
    const lines = transcript.split('\n');
    const processedTranscript = lines.slice(1).join('\n');
    
    console.log('NoteContent - Transcrição processada:', {
      noteId: note.id,
      processedLength: processedTranscript.length,
      hasContent: !!processedTranscript,
      firstProcessedLine: processedTranscript.split('\n')[0],
      processedPreview: processedTranscript.substring(0, 100) // Add preview of processed content
    });
    
    return processedTranscript.trim();
  };

  // Processa a transcrição uma única vez e valida o resultado
  const processedTranscript = getTranscriptWithoutFirstLine(note.original_transcript);
  const isTranscriptValid = processedTranscript && processedTranscript.length > 0;

  console.log('NoteContent - Resultado final do processamento:', {
    noteId: note.id,
    isTranscriptValid,
    processedTranscriptLength: processedTranscript.length,
    willShowTranscript: isTranscriptValid,
    transcriptPreview: isTranscriptValid ? processedTranscript.substring(0, 100) : 'N/A'
  });

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
      {isTranscriptValid ? (
        <>
          <TranscriptAccordion transcript={processedTranscript} />
          <TranscriptChat 
            transcript={processedTranscript} 
            key={note.id} // Add key to force re-render on note change
          />
        </>
      ) : (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">
            Não foi possível encontrar a transcrição para este documento.
            {note.original_transcript === null ? 
              ' A transcrição original não está disponível.' : 
              ' A transcrição está vazia ou em formato inválido.'}
          </p>
        </div>
      )}
    </div>
  );
};