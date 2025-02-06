import { Note } from "@/integrations/supabase/types/notes";

interface TranscriptValidationProps {
  note: Note;
}

export const TranscriptValidation = ({ note }: TranscriptValidationProps) => {
  const getTranscriptWithoutFirstLine = (transcript: string | null): string => {
    console.log('TranscriptValidation - Input transcript details:', { 
      noteId: note.id,
      hasTranscript: !!transcript,
      transcriptType: typeof transcript,
      transcriptLength: transcript?.length,
      transcriptValue: transcript,
      firstFewChars: transcript?.substring(0, 50)
    });

    if (!transcript) {
      console.log('TranscriptValidation - Transcrição não encontrada:', { 
        noteId: note.id,
        transcriptValue: transcript,
        transcriptType: typeof transcript
      });
      return '';
    }

    if (typeof transcript !== 'string') {
      console.log('TranscriptValidation - Tipo inválido de transcrição:', {
        noteId: note.id,
        transcriptType: typeof transcript,
        transcriptValue: transcript
      });
      return '';
    }

    console.log('TranscriptValidation - Processando transcrição:', {
      noteId: note.id,
      transcriptLength: transcript.length,
      firstLine: transcript.split('\n')[0],
      transcriptPreview: transcript.substring(0, 100)
    });
    
    const lines = transcript.split('\n');
    const processedTranscript = lines.slice(1).join('\n');
    
    console.log('TranscriptValidation - Transcrição processada:', {
      noteId: note.id,
      processedLength: processedTranscript.length,
      hasContent: !!processedTranscript,
      firstProcessedLine: processedTranscript.split('\n')[0],
      processedPreview: processedTranscript.substring(0, 100)
    });
    
    return processedTranscript.trim();
  };

  const processedTranscript = getTranscriptWithoutFirstLine(note.original_transcript);
  const validTranscript = processedTranscript && processedTranscript.trim() !== ''
    ? processedTranscript
    : null;

  console.log('TranscriptValidation - Resultado final do processamento:', {
    noteId: note.id,
    hasValidTranscript: !!validTranscript,
    processedTranscriptLength: processedTranscript.length,
    willShowTranscript: !!validTranscript,
    transcriptPreview: validTranscript ? validTranscript.substring(0, 100) : 'N/A',
    originalTranscriptExists: !!note.original_transcript,
    originalTranscriptLength: note.original_transcript?.length
  });

  return { validTranscript };
};