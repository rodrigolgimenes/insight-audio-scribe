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
        transcript: 'null'
      });
      return '';
    }

    const lines = transcript.split('\n');
    console.log('TranscriptValidation - Processando transcrição:', {
      noteId: note.id,
      transcriptLength: transcript.length,
      firstLine: lines[0],
      transcriptPreview: transcript.substring(0, 100) + '...'
    });

    // Retorna a transcrição completa se ela existir
    return transcript;
  };

  const processTranscript = (transcript: string): string => {
    if (!transcript.trim()) {
      return '';
    }

    console.log('TranscriptValidation - Transcrição processada:', {
      noteId: note.id,
      hasContent: !!transcript,
      processedLength: transcript.length,
      firstProcessedLine: transcript.split('\n')[0],
      processedPreview: transcript.substring(0, 100)
    });

    return transcript;
  };

  const transcript = note.original_transcript || note.processed_content;
  const transcriptWithoutFirstLine = getTranscriptWithoutFirstLine(transcript);
  const processedTranscript = processTranscript(transcriptWithoutFirstLine);
  const validTranscript = processedTranscript;

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