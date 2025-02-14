
import { useEffect, useState } from "react";
import { RecordingCard } from "./RecordingCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [recordingsWithProgress, setRecordingsWithProgress] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Fetch initial progress for all recordings
    const fetchInitialProgress = async () => {
      const newProgress = new Map<string, number>();
      
      for (const recording of recordings) {
        const { data } = await supabase
          .from('notes')
          .select('processing_progress')
          .eq('recording_id', recording.id)
          .single();
        
        if (data) {
          newProgress.set(recording.id, data.processing_progress || 0);
        }
      }
      
      setRecordingsWithProgress(newProgress);
    };

    fetchInitialProgress();

    // Subscribe to note updates
    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        (payload: any) => {
          console.log('Note update received:', payload);
          if (payload.new && payload.new.recording_id) {
            setRecordingsWithProgress(prev => {
              const newMap = new Map(prev);
              newMap.set(payload.new.recording_id, payload.new.processing_progress || 0);
              return newMap;
            });

            // Show toast messages for important status changes
            if (payload.new.status === 'completed' && payload.old?.status !== 'completed') {
              toast({
                title: "Transcription complete",
                description: "Your recording has been successfully transcribed.",
              });
            } else if (payload.new.status === 'error' && payload.old?.status !== 'error') {
              toast({
                title: "Transcription failed",
                description: "There was an error processing your recording. Please try again.",
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recordings, toast]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          progress={recordingsWithProgress.get(recording.id) || 0}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
};
