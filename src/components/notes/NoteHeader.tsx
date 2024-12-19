import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  return (
    <div className="mb-6 flex justify-between items-center">
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => navigate("/app")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to notes
      </Button>
      <NoteActions
        onOpenTagsDialog={onOpenTagsDialog}
        onOpenMoveDialog={onOpenMoveDialog}
        onOpenDeleteDialog={onOpenDeleteDialog}
      />
    </div>
  );
};