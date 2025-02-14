
import { useEffect, useRef } from "react";
import { RecordingCard } from "./RecordingCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());

  // Use React Query to manage recording progress state
  const { data: recordingsWithProgress = new Map() } = useQuery({
    queryKey: ['recordings-progress'],
    queryFn: async () => {
      const newProgress = new Map<string, number>();
      
      for (const recording of recordings) {
        if (processedIds.current.has(recording.id)) continue;

        const { data } = await supabase
          .from('notes')
          .select('processing_progress, status')
          .eq('recording_id', recording.id)
          .single();
        
        if (data) {
          newProgress.set(recording.id, data.processing_progress || 0);
          if (data.status === 'completed') {
            processedIds.current.add(recording.id);
          }
        }
      }
      
      return newProgress;
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes (formerly cacheTime)
  });

  useEffect(() => {
    // Subscribe to notes updates
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
            const recordingId = payload.new.recording_id;
            
            // Only process if we haven't marked this recording as completed
            if (!processedIds.current.has(recordingId)) {
              // Update the query cache
              queryClient.setQueryData(['recordings-progress'], (old: Map<string, number>) => {
                const updated = new Map(old);
                updated.set(recordingId, payload.new.processing_progress || 0);
                return updated;
              });

              // Mark as processed if completed
              if (payload.new.status === 'completed') {
                processedIds.current.add(recordingId);
                
                toast({
                  title: "Transcription completed",
                  description: "Your recording has been successfully transcribed.",
                });
              } else if (payload.new.status === 'error') {
                toast({
                  title: "Transcription error",
                  description: "There was an error processing your recording. Please try again.",
                  variant: "destructive",
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

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
