import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  onPlay: (id: string) => void;
}

export const RecordingCard = ({
  recording,
  onPlay,
}: RecordingCardProps) => {
  const formatDuration = (duration: number | null) => {
    if (!duration) return "Unknown duration";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusMessage = (recording: Recording) => {
    if (recording.status === 'completed' && recording.transcription?.includes('No audio was captured')) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>No audio was captured in this recording</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
      onClick={() => onPlay(recording.id)}
    >
      <CardHeader>
        <CardTitle className="text-xl">{recording.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusMessage(recording)}
        {recording.status === 'completed' && !recording.transcription?.includes('No audio was captured') && (
          <>
            <div className="text-sm text-gray-600">
              <h3 className="font-semibold mb-1">Transcription:</h3>
              <p className="line-clamp-3">{recording.transcription}</p>
            </div>
            {recording.summary && (
              <div className="text-sm text-gray-600">
                <h3 className="font-semibold mb-1">Summary:</h3>
                <p className="line-clamp-3">{recording.summary}</p>
              </div>
            )}
          </>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(recording.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};