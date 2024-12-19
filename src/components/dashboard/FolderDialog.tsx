import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  folders: any[];
  newFolderName: string;
  onNewFolderNameChange: (value: string) => void;
  onCreateNewFolder: () => void;
  onSelectFolder: (folderId: string) => void;
}

export const FolderDialog = ({
  isOpen,
  onOpenChange,
  folders,
  newFolderName,
  onNewFolderNameChange,
  onCreateNewFolder,
  onSelectFolder,
}: FolderDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add notes to folder:</DialogTitle>
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
            <Button
              key={folder.id}
              className="w-full justify-start"
              variant="ghost"
              onClick={() => onSelectFolder(folder.id)}
            >
              <FileText className="w-4 h-4 mr-2" />
              {folder.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};