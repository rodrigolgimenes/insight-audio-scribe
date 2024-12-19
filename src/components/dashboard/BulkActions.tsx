import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BulkActionsProps {
  selectedNotes: string[];
  onMoveToFolder: () => void;
  onDelete: () => void;
}

export const BulkActions = ({
  selectedNotes,
  onMoveToFolder,
  onDelete,
}: BulkActionsProps) => {
  if (selectedNotes.length === 0) return null;

  return (
    <>
      <Button variant="outline" onClick={onMoveToFolder}>
        Move to folder
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete selected
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedNotes.length} selected notes?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};