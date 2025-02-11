
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
  folder: { id: string; name: string; description: string | null } | null;
  onRenameNote: (newTitle: string) => Promise<void>;
  onOpenTagsDialog: () => void;
  onOpenMoveDialog: () => void;
  onOpenDeleteDialog: () => void;
}

export const NoteHeader = ({
  title,
  createdAt,
  duration,
  folder,
  onRenameNote,
  onOpenTagsDialog,
  onOpenMoveDialog,
  onOpenDeleteDialog,
}: NoteHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handleMenuItemClick = (action: () => void) => (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(false);
    action();
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
            <span>
              Folder: {folder ? folder.name : "Uncategorized"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={handleMenuItemClick(onOpenTagsDialog)}>
                Add tags
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleMenuItemClick(onOpenMoveDialog)}>
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={handleMenuItemClick(onOpenDeleteDialog)}
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
