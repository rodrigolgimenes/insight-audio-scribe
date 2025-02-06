import { Note } from "@/integrations/supabase/types/notes";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Play, Share2, Pencil, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface NotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: Note[];
  onNoteClick: (note: Note) => void;
  onNoteSelect: (note: Note) => void;
}

export const NotesGrid = ({
  notes,
  isSelectionMode,
  selectedNotes,
  onNoteClick,
  onNoteSelect,
}: NotesGridProps) => {
  const formatDuration = (duration: number | null) => {
    if (!duration) return "Unknown duration";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`bg-white p-6 rounded-xl border hover:shadow-lg transition-all duration-200 relative group ${
            selectedNotes.includes(note)
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200"
          }`}
          onClick={() => onNoteClick(note)}
        >
          {isSelectionMode && (
            <div className="absolute top-4 right-4">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note)}
                onChange={() => onNoteSelect(note)}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                {note.title}
              </h3>
              {note.original_transcript ? (
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {note.original_transcript}
                </p>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">No audio was captured in this recording</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(0)} {/* Replace with actual duration when available */}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-[#9b87f5] hover:bg-[#8b77e5] text-white"
              onClick={(e) => {
                e.stopPropagation();
                // Handle play
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              Play
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle edit
              }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                // Handle delete
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle share
              }}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};