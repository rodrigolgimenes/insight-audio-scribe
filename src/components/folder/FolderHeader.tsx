
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  PlusCircle, 
  Trash2, 
  Pencil,
  CheckCircle, 
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface FolderHeaderProps {
  folderName: string;
  folderId: string;
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
  selectedNotes: any[];
  onAddNote?: () => void;
  onRenameFolder: (name: string) => void;
  onDeleteFolder: () => void;
}

export const FolderHeader: React.FC<FolderHeaderProps> = ({
  folderName,
  folderId,
  isSelectionMode,
  setIsSelectionMode,
  selectedNotes,
  onAddNote,
  onRenameFolder,
  onDeleteFolder,
}) => {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(folderName);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleRenameStart = () => {
    setEditedName(folderName);
    setIsEditingName(true);
  };

  const handleRenameSubmit = () => {
    if (editedName.trim() !== '' && editedName !== folderName) {
      onRenameFolder(editedName);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(folderName);
    }
  };

  const handleDeleteConfirm = () => {
    onDeleteFolder();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-4">
        {isEditingName ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="border border-gray-300 rounded px-2 py-1 text-xl font-semibold"
            />
            <button onClick={handleRenameSubmit} className="text-green-600 hover:text-green-800">
              <CheckCircle className="h-5 w-5" />
            </button>
            <button 
              onClick={() => {
                setIsEditingName(false);
                setEditedName(folderName);
              }}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <h1 className="text-2xl font-semibold">{folderName}</h1>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {!isSelectionMode ? (
          <>
            <Button 
              onClick={() => setIsSelectionMode(true)}
              variant="outline"
              size="sm"
            >
              Select
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Folder Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRenameStart}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename Folder
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedNotes.length} selected
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsSelectionMode(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? Notes inside this folder will be moved to Uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
