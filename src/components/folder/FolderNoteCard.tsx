
import { Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/utils/formatDuration";
import { formatDate } from "@/utils/formatDate";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  original_transcript: string | null;
  created_at: string;
  duration: number;
  tags: Tag[];
}

interface FolderNoteCardProps {
  note: Note;
  isSelectionMode: boolean;
  isSelected: boolean;
  onClick: () => void;
  onToggleSelection: () => void;
}

export const FolderNoteCard = ({
  note,
  isSelectionMode,
  isSelected,
  onClick,
  onToggleSelection,
}: FolderNoteCardProps) => {
  return (
    <div
      className="bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={() => isSelectionMode ? onToggleSelection() : onClick()}
    >
      {isSelectionMode && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="h-4 w-4"
          />
        </div>
      )}
      <h3 className="font-medium mb-2">{note.title}</h3>
      <p className="text-gray-600 text-sm line-clamp-3">
        {note.original_transcript || "No transcript available"}
      </p>
      <div className="mt-4 space-y-2">
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <Badge 
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center text-xs text-gray-500 gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(note.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(note.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};
