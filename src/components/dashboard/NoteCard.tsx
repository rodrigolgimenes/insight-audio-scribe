import { Note } from "@/integrations/supabase/types/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, CheckSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteDuration } from "./NoteDuration";
import { formatDate } from "@/utils/formatDate";

interface NoteCardProps {
  note: Note;
  isSelectionMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

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
          <NoteDuration duration={note.duration} />
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(note.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};