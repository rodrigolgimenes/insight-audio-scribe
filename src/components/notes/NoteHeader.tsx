
import { Button } from "@/components/ui/button";
import { Download, Play, Pause, Pencil, MoreVertical } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="flex items-center gap-3">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenTagsDialog}>
                Add tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenMoveDialog}>
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onOpenDeleteDialog}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
