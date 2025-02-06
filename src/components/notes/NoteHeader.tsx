import { Button } from "@/components/ui/button";
import { Tag, FolderOpen, Trash2 } from "lucide-react";

interface NoteHeaderProps {
  title: string;
  onOpenTagsDialog: () => void;
  onOpenMoveDialog: () => void;
  onOpenDeleteDialog: () => void;
}

export const NoteHeader = ({
  title,
  onOpenTagsDialog,
  onOpenMoveDialog,
  onOpenDeleteDialog,
}: NoteHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex gap-3">
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
  );
};