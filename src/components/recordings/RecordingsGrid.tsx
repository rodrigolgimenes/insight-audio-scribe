
import { useEffect } from "react";
import { RecordingCard } from "./RecordingCard";
import { supabase } from "@/integrations/supabase/client";

interface Recording {
  id: string;
  title: string;
  duration: number | null;
  created_at: string;
  transcription: string | null;
  summary: string | null;
  status: string;
}

interface RecordingsGridProps {
  recordings: Recording[];
  onPlay: (id: string) => void;
}

export const RecordingsGrid = ({
  recordings,
  onPlay,
}: RecordingsGridProps) => {
  useEffect(() => {
    // Subscribe to real-time updates for recordings
    const channel = supabase
      .channel('recordings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recordings'
        },
        (payload) => {
          console.log('Recording update received:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
};
