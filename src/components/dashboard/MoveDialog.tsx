
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "lucide-react";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
}

export function MoveDialog({ open, onOpenChange, selectedIds }: MoveDialogProps) {
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleMove = async (folderId: string) => {
    try {
      // Move files to selected folder
      for (const noteId of selectedIds) {
        await supabase.rpc('move_note_to_folder', {
          p_note_id: noteId,
          p_folder_id: folderId
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving files:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {selectedIds.length} files to folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-500" />
                <span>{folder.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMove(folder.id)}
              >
                Move here
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
