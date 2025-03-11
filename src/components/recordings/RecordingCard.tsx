
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  const { data: noteData } = useQuery({
    queryKey: ['note-id', recording.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('id, duration')
        .eq('recording_id', recording.id)
        .single();
      return data;
    },
  });

  // Use the duration from the note if available (as it might be more accurate)
  const displayDuration = noteData?.duration || recording.duration;
  
  console.log('Recording duration:', {
    recordingId: recording.id,
    recordingDuration: recording.duration,
    noteDuration: noteData?.duration,
    displayDuration
  });

  const getStatusMessage = (recording: Recording, progress: number) => {
    console.log('Status:', recording.status, 'Progress:', progress);
    
    if (recording.status === 'completed' && recording.transcription?.includes('No audio was captured')) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>No audio was captured</span>
        </div>
      );
    }

    switch (recording.status) {
      case 'pending':
      case 'processing':
      case 'uploaded':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing audio... {Math.round(progress)}%</span>
          </div>
        );
      case 'transcribing':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transcribing... {Math.round(progress)}%</span>
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
            <span>Processing... {Math.round(progress)}%</span>
          </div>
        );
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If status is completed and we have a note ID, navigate to note page
    if (recording.status === 'completed' && noteData?.id) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/notes/${noteData.id}`);
    } else if (recording.status !== 'completed') {
      // If not completed, just play the recording
      onPlay(recording.id);
    }
  };

  const cursorClass = recording.status === 'completed' ? 'cursor-pointer' : 'cursor-default';

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow ${cursorClass} hover:bg-gray-50`}
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="text-xl">{recording.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusMessage(recording, progress)}
        
        {['pending', 'processing', 'transcribing', 'uploaded'].includes(recording.status) && progress > 0 && (
          <Progress value={progress} className="w-full" />
        )}

        {recording.status === 'completed' && !recording.transcription?.includes('No audio was captured') && (
          <>
            <div className="text-sm text-gray-600">
              <h3 className="font-semibold mb-1">Transcription:</h3>
              <p className="line-clamp-3">{recording.transcription}</p>
            </div>
          </>
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
      </CardContent>
    </Card>
  );
};
