import { Button } from "@/components/ui/button";
import { Trash2, FolderOpen } from "lucide-react";
import { Note } from "@/integrations/supabase/types/notes";
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
  selectedNotes: Note[];
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
    <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <span className="text-sm font-medium text-gray-600">
        {selectedNotes.length} notes selected
      </span>
      <div className="flex-1" />
      <Button 
        variant="outline" 
        onClick={onMoveToFolder}
        className="gap-2"
      >
        <FolderOpen className="h-4 w-4" />
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
    </div>
  );
};