
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Recording {
  id: string;
  title: string;
  duration: number | null;
  created_at: string;
  transcription: string | null;
  summary: string | null;
  status: string;
}

interface RecordingCardProps {
  recording: Recording;
  progress: number;
  onPlay: (id: string) => void;
}

export const RecordingCard = ({
  recording,
  progress,
  onPlay,
}: RecordingCardProps) => {
  const navigate = useNavigate();

  // Fetch the associated note ID for this recording
  const { data: noteData, refetch } = useQuery({
    queryKey: ['note-id', recording.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('id, duration, status, processing_progress, original_transcript')
        .eq('recording_id', recording.id)
        .single();
      return data;
    },
  });

  // Check if meeting minutes exist to help determine the true status
  const { data: minutesExist } = useQuery({
    queryKey: ['meeting-minutes-exist', noteData?.id],
    queryFn: async () => {
      if (!noteData?.id) return false;
      
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select('id')
        .eq('note_id', noteData.id)
        .maybeSingle();
        
      return !!data?.id;
    },
    enabled: !!noteData?.id
  });

  // Configure real-time updates for notes
  useEffect(() => {
    const channel = supabase
      .channel(`recording-${recording.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `recording_id=eq.${recording.id}`
        },
        (payload) => {
          console.log('Note updated:', payload);
          refetch();  // Reload note data
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [recording.id, refetch]);

  // Use the duration from the note if available (as it might be more accurate)
  const displayDuration = noteData?.duration || recording.duration;
  
  // Use the progress from the note when available
  const displayProgress = Math.round(noteData?.processing_progress || progress || 0);
  
  // Determine the effective status based on all available information
  let displayStatus = noteData?.status || recording.status;
  
  // If meeting minutes exist but status is still generating_minutes, consider it completed
  if (minutesExist && displayStatus === 'generating_minutes') {
    displayStatus = 'completed';
  }
  
  // If transcript exists but status doesn't show completed, it should be completed
  if (noteData?.original_transcript && displayStatus !== 'completed' && displayStatus !== 'error') {
    displayStatus = 'completed';
  }
  
  // If progress is 100% and status is still processing/generating_minutes, consider it completed
  if (displayProgress >= 100 && (displayStatus === 'generating_minutes' || displayStatus === 'processing')) {
    displayStatus = 'completed';
  }
  
  console.log('Recording card data:', {
    recordingId: recording.id,
    displayStatus,
    displayProgress,
    noteStatus: noteData?.status,
    recordingStatus: recording.status,
    minutesExist
  });

  const getStatusMessage = (status: string, progress: number) => {
    if (status === 'completed' && recording.transcription?.includes('No audio was captured')) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>No audio was captured</span>
        </div>
      );
    }

    switch (status) {
      case 'pending':
      case 'processing':
      case 'uploaded':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing audio... {progress}%</span>
          </div>
        );
      case 'transcribing':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transcribing... {progress}%</span>
          </div>
        );
      case 'generating_minutes':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating Minutes {progress}%</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Error processing recording</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing... {progress}%</span>
          </div>
        );
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If we have a note ID, navigate to note page
    if (noteData?.id) {
      navigate(`/app/notes/${noteData.id}`);
    } else {
      onPlay(recording.id);
    }
  };

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={handleCardClick}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg">{recording.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {getStatusMessage(displayStatus, displayProgress)}
          
          {displayStatus !== 'completed' && displayStatus !== 'error' && (
            <Progress value={displayProgress} className="h-2" />
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(displayDuration)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(recording.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
