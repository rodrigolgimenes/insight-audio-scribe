
// This component is being updated to use projects instead of folders
// This file is being kept as a placeholder until it's fully integrated or removed
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface FolderActionsProps {
  tags: Tag[];
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
  selectedNotes: string[];
  onDeleteSelected: () => void;
}

export const FolderActions = ({
  tags,
  isSelectionMode,
  setIsSelectionMode,
  selectedNotes,
  onDeleteSelected,
}: FolderActionsProps) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      {tags && tags.length > 0 && (
        <div className="flex gap-2">
          {tags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="secondary"
              style={{ backgroundColor: tag.color }}
              className="text-white"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600">Select notes</span>
        <Switch
          checked={isSelectionMode}
          onCheckedChange={setIsSelectionMode}
        />
      </div>
      {isSelectionMode && selectedNotes.length > 0 && (
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
                Are you sure you want to delete {selectedNotes.length} selected notes? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteSelected}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
