import { Button } from "@/components/ui/button";
import { Tag, Folder, Trash2 } from "lucide-react";

interface NoteActionsProps {
  onOpenTagsDialog: () => void;
  onOpenMoveDialog: () => void;
  onOpenDeleteDialog: () => void;
}

export const NoteActions = ({
  onOpenTagsDialog,
  onOpenMoveDialog,
  onOpenDeleteDialog,
}: NoteActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="gap-2" onClick={onOpenTagsDialog}>
        <Tag className="w-4 h-4" />
        Add Tags
      </Button>

      <Button variant="outline" className="gap-2" onClick={onOpenMoveDialog}>
        <Folder className="w-4 h-4" />
        Move to Folder
      </Button>

      <Button variant="destructive" size="icon" onClick={onOpenDeleteDialog}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};