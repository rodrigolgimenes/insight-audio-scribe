
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

  // Use React Query para gerenciar o estado de progresso das gravações
  const { data: recordingsWithProgress = new Map() } = useQuery({
    queryKey: ['recordings-progress'],
    queryFn: async () => {
      console.log('Fetching progress for recordings:', recordings.map(r => r.id));
      const existingProgress = queryClient.getQueryData(['recordings-progress']) as Map<string, number> || new Map();
      const newProgress = new Map(existingProgress);
      
      for (const recording of recordings) {
        // Pula se já temos o progresso para esta gravação
        if (newProgress.has(recording.id)) {
          console.log('Using cached progress for recording:', recording.id);
          continue;
        }

        console.log('Fetching progress for recording:', recording.id);
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('processing_progress, status')
            .eq('recording_id', recording.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching note progress:', error);
            continue;
          }
          
          if (data) {
            newProgress.set(recording.id, data.processing_progress || 0);
            if (data.status === 'completed') {
              processedIds.current.add(recording.id);
            }
          }
        } catch (err) {
          console.error('Error processing recording:', recording.id, err);
        }
      }
      
      return newProgress;
    },
    staleTime: 1000 * 60, // Dados considerados frescos por 1 minuto
    initialData: new Map()
  });

  useEffect(() => {
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
            
            // Atualiza o cache apenas se a nota não estiver completa
            if (!processedIds.current.has(recordingId)) {
              queryClient.setQueryData(['recordings-progress'], (old: Map<string, number> | undefined) => {
                const updated = new Map(old || new Map());
                const newProgress = payload.new.processing_progress || 0;
                
                // Só atualiza se o progresso for maior
                if (!updated.has(recordingId) || newProgress > (updated.get(recordingId) || 0)) {
                  console.log(`Updating progress for ${recordingId}:`, newProgress);
                  updated.set(recordingId, newProgress);
                }
                
                return updated;
              });

              if (payload.new.status === 'completed') {
                processedIds.current.add(recordingId);
                toast({
                  title: "Transcription completed",
                  description: "Your recording has been successfully transcribed.",
                });
                
                // Força uma revalidação dos dados
                queryClient.invalidateQueries({
                  queryKey: ['recordings-progress']
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
      console.log('Cleaning up subscription');
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
