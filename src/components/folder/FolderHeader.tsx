
import { useState, useRef, useEffect } from "react";
import { Search, Edit2, Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

interface FolderHeaderProps {
  folderName: string;
  folderId: string;
  onRename: (newName: string) => Promise<void>;
  onDelete: (deleteNotes: boolean) => Promise<void>;
  isRenaming?: boolean;
  isDeleting?: boolean;
}

export const FolderHeader = ({ 
  folderName, 
  folderId, 
  onRename, 
  onDelete,
  isRenaming = false,
  isDeleting = false 
}: FolderHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(folderName);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = async () => {
    if (editedName.trim() && editedName !== folderName) {
      await onRename(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setEditedName(folderName);
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-2xl font-bold h-auto py-1 px-2"
              disabled={isRenaming}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              disabled={isRenaming}
              className="h-9 w-9"
            >
              {isRenaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{folderName}</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
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
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                  <AlertDialogDescription>
                    What would you like to do with the notes in this folder?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(false)}
                    disabled={isDeleting}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    Move notes to Uncategorized
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={() => onDelete(true)}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete folder and all notes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="search"
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
      </div>
    </>
  );
};
