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

  // Fetch current folder for the selected notes (if they're all in the same folder)
  const { data: currentFolder, isLoading: isLoadingCurrentFolder } = useQuery({
    queryKey: ["notes-current-folder", selectedNotes.map(note => note.id)],
    queryFn: async () => {
      if (selectedNotes.length === 0) return null;

      try {
        const { data, error } = await supabase
          .from("notes_folders")
          .select(`
            folder:folders (
              id,
              name
            )
          `)
          .eq("note_id", selectedNotes[0].id)
          .single();

        if (error) {
          console.error("Error fetching current folder:", error);
          toast({
            title: "Error",
            description: "Failed to fetch current folder",
            variant: "destructive",
          });
          return null;
        }
        
        return data?.folder || null;
      } catch (error) {
        console.error("Error in current folder query:", error);
        return null;
      }
    },
    enabled: selectedNotes.length > 0,
    retry: 1,
  });

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
      {isSelectionMode && selectedNotes.length > 0 && (
        <BulkActions
          selectedNotes={selectedNotes}
          onMoveToFolder={() => setIsFolderDialogOpen(true)}
          onDelete={onDeleteNotes}
        />
      )}

      <NotesGrid
        notes={notes}
        isSelectionMode={isSelectionMode}
        selectedNotes={selectedNotes}
        onNoteClick={handleNoteClick}
      />

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folders={folders}
        currentFolderId={currentFolder?.id || null}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateNewFolder={onCreateNewFolder}
        onSelectFolder={onMoveToFolder}
      />
    </>
  );
};