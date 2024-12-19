import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface MoveNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  folders: any[];
  currentFolderId: string | null;
  onMoveToFolder: (folderId: string) => void;
}

export const MoveNoteDialog = ({
  isOpen,
  onOpenChange,
  folders,
  currentFolderId,
  onMoveToFolder,
}: MoveNoteDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move note to folder:</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {folders?.length === 0 && (
            <p className="text-center text-gray-500">No folders found</p>
          )}
          <div className="space-y-2">
            {folders?.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>{folder.name}</span>
                  {folder.id === currentFolderId && (
                    <Badge variant="secondary">Current folder</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={folder.id === currentFolderId}
                  onClick={() => onMoveToFolder(folder.id)}
                >
                  Move here
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};