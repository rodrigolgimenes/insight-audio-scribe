import { Note } from "@/integrations/supabase/types/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, AlertCircle, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  isSelectionMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const formatDuration = (duration: number | null) => {
  if (!duration) return "Unknown duration";
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0 && hours === 0) { // Only show seconds if less than an hour
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' and ');
};

export const NoteCard = ({ note, isSelectionMode, isSelected, onClick }: NoteCardProps) => {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 relative",
        isSelectionMode && isSelected && "bg-gray-50 ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      {isSelectionMode && (
        <div className="absolute top-4 right-4">
          <CheckSquare 
            className={cn(
              "h-6 w-6",
              isSelected ? "text-primary" : "text-gray-300"
            )} 
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{note.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {note.original_transcript?.includes('No audio was captured') ? (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span>No audio was captured in this recording</span>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <h3 className="font-semibold mb-1">Transcription:</h3>
            <p className="line-clamp-3">{note.original_transcript}</p>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(note.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};