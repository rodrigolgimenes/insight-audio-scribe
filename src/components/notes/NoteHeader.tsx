
import { Button } from "@/components/ui/button";
import { Tag, FolderOpen, Trash2, Download, Play, Pause, Pencil } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface NoteHeaderProps {
  title: string;
  createdAt: string;
  duration: number | null;
  audioUrl: string | null;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onRenameNote: (newTitle: string) => Promise<void>;
  onOpenTagsDialog: () => void;
  onOpenMoveDialog: () => void;
  onOpenDeleteDialog: () => void;
}

export const NoteHeader = ({
  title,
  createdAt,
  duration,
  audioUrl,
  isPlaying = false,
  onPlayPause,
  onRenameNote,
  onOpenTagsDialog,
  onOpenMoveDialog,
  onOpenDeleteDialog,
}: NoteHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleRename = async () => {
    if (editedTitle.trim() && editedTitle !== title) {
      await onRenameNote(editedTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedTitle(title);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="text-2xl font-bold"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span>Uploaded {formatDate(createdAt)}</span>
            {duration !== null && (
              <span>Duration: {formatDuration(duration)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {audioUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onPlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a href={audioUrl} download>
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onOpenTagsDialog}
          >
            <Tag className="h-4 w-4" />
            Add tags
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onOpenMoveDialog}
          >
            <FolderOpen className="h-4 w-4" />
            Move to folder
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={onOpenDeleteDialog}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
