
import { Note } from "@/integrations/supabase/types/notes";
import { TitleSection } from "./TitleSection";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { MeetingMinutes } from "./MeetingMinutes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAudioUrl = async () => {
      if (note?.audio_url) {
        try {
          console.log("[NoteContent] Note received:", note);
          console.log("[NoteContent] Audio URL from note:", note.audio_url);
          
          // Se já for uma URL completa, usar diretamente
          if (note.audio_url.startsWith('http')) {
            setAudioUrl(note.audio_url);
            return;
          }
          
          // Caso contrário, gerar URL pública
          const { data: { publicUrl } } = supabase
            .storage
            .from('audio_recordings')
            .getPublicUrl(note.audio_url);
          
          console.log("[NoteContent] Generated Supabase public URL:", publicUrl);
          setAudioUrl(publicUrl);
        } catch (error) {
          console.error("[NoteContent] Error getting audio URL:", error);
        }
      } else {
        console.log("[NoteContent] No audio_url in note object");
      }
    };

    loadAudioUrl();
  }, [note?.audio_url]);

  return (
    <div className="space-y-8">
      <TitleSection note={note} />
      <MeetingMinutes 
        transcript={note.original_transcript} 
        noteId={note.id} 
        audioUrl={audioUrl}
      />
      <TranscriptAccordion transcript={note.original_transcript} />
      <TranscriptChat note={note} />
    </div>
  );
};
