
import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";
import { BulkActions } from "./BulkActions";
import { FolderDialog } from "./FolderDialog";
import { NotesGrid } from "./NotesGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface DashboardContentProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  isFolderDialogOpen: boolean;
  setIsFolderDialogOpen: (value: boolean) => void;
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  onCreateNewFolder: () => Promise<void>;
  onMoveToFolder: (folderId: string) => Promise<void>;
  onDeleteNotes: () => Promise<void>;
  onNoteSelect: (note: Note) => void;
}

export const DashboardContent = ({
  notes,
  isLoading,
  isSelectionMode,
  selectedNotes,
  isFolderDialogOpen,
  setIsFolderDialogOpen,
  newFolderName,
  setNewFolderName,
  onCreateNewFolder,
  onMoveToFolder,
  onDeleteNotes,
  onNoteSelect,
}: DashboardContentProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch available folders
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("folders")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching folders:", error);
          toast({
            title: "Error",
            description: "Failed to fetch folders",
            variant: "destructive",
          });
          return [];
        }

        return data;
      } catch (error) {
        console.error("Error in folders query:", error);
        return [];
      }
    },
    retry: 1,
  });

  const handleNoteClick = (note: Note) => {
    if (isSelectionMode) {
      onNoteSelect(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[200px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No notes found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating your first note.
        </p>
      </div>
    );
  }

  return (
    <>
      <NotesGrid
        notes={notes}
        isSelectionMode={isSelectionMode}
        selectedNotes={selectedNotes}
        onNoteClick={handleNoteClick}
        onDeleteSelected={onDeleteNotes}
        onMoveToFolder={() => setIsFolderDialogOpen(true)}
      />

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folders={folders}
        currentFolderId={null}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateNewFolder={onCreateNewFolder}
        onSelectFolder={onMoveToFolder}
      />
    </>
  );
};
