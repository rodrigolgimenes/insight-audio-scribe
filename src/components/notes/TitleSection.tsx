import { Note } from "@/integrations/supabase/types/notes";

interface TitleSectionProps {
  note: Note;
}

export const TitleSection = ({ note }: TitleSectionProps) => {
  const extractTitleAndDateTime = (transcript: string | null): string => {
    if (!transcript) {
      console.log('TitleSection - Erro ao extrair título: transcrição ausente');
      return '';
    }
    const firstLine = transcript.split('\n')[0];
    const match = firstLine.match(/Recording (\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})/);
    
    console.log('TitleSection - Extração de título:', {
      firstLine,
      hasMatch: !!match,
      extractedDateTime: match ? `Recording ${match[1]}, ${match[2]}` : ''
    });
    
    return match ? `Recording ${match[1]}, ${match[2]}` : '';
  };

  return (
    <div className="prose max-w-none">
      <h1 className="text-3xl font-bold mb-6">{note.title}</h1>
      <p className="text-gray-600 mb-4">{extractTitleAndDateTime(note.original_transcript)}</p>
    </div>
  );
};