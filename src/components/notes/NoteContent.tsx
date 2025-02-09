
import { Note } from "@/integrations/supabase/types/notes";
import { TitleSection } from "./TitleSection";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { MeetingMinutes } from "./MeetingMinutes";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAudioUrl = async () => {
      if (note?.audio_url) {
        try {
          const { data: { publicUrl } } = supabase
            .storage
            .from('audio_recordings')
            .getPublicUrl(note.audio_url);
          
          setAudioUrl(publicUrl);
        } catch (error) {
          console.error("Error getting audio URL:", error);
        }
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
