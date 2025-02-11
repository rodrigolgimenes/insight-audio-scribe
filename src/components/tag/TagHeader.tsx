
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface TagHeaderProps {
  tag: { name: string } | null;
  isEditing: boolean;
  editedName: string;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
}

export function TagHeader({
  tag,
  isEditing,
  editedName,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDelete,
}: TagHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={editedName}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditSubmit();
                if (e.key === "Escape") onEditCancel();
              }}
              className="text-2xl font-semibold h-auto py-1 px-2"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={onEditSubmit}
              className="h-9 w-9"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onEditCancel}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">
              Tag: {tag?.name}
            </h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={onEditStart}
              className="h-9 w-9"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-semibold text-center">
                    Delete Tag
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-gray-600">
                    Are you sure you want to delete this tag? This will remove the tag from all notes it's been assigned to.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
                  <AlertDialogAction
                    onClick={() => {
                      onDelete();
                      setShowDeleteDialog(false);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Delete tag
                  </AlertDialogAction>
                  <AlertDialogCancel className="w-full bg-white text-gray-600 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-colors border border-gray-200">
                    Cancel
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
