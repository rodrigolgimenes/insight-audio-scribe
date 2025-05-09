import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface FolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  folders: any[];
  currentFolderId: string | null;
  newFolderName: string;
  onNewFolderNameChange: (value: string) => void;
  onCreateNewFolder: () => void;
  onSelectFolder: (folderId: string) => void;
}

export const FolderDialog = ({
  isOpen,
  onOpenChange,
  folders,
  currentFolderId,
  newFolderName,
  onNewFolderNameChange,
  onCreateNewFolder,
  onSelectFolder,
}: FolderDialogProps) => {
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
            <Input
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => onNewFolderNameChange(e.target.value)}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={onCreateNewFolder}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create new folder
            </Button>
          </div>
          {folders?.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{folder.name}</span>
                {folder.id === currentFolderId && (
                  <Badge variant="secondary">Current folder</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={folder.id === currentFolderId}
                onClick={() => onSelectFolder(folder.id)}
              >
                Move here
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
