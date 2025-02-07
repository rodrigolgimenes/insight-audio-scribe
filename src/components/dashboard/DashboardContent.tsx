import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";
import { BulkActions } from "./BulkActions";
import { FolderDialog } from "./FolderDialog";
import { NotesGrid } from "./NotesGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch current folder for the selected notes (if they're all in the same folder)
  const { data: currentFolder } = useQuery({
    queryKey: ["notes-current-folder", selectedNotes.map(note => note.id)],
    queryFn: async () => {
      if (selectedNotes.length === 0) return null;

      const { data } = await supabase
        .from("notes_folders")
        .select(`
          folder:folders (
            id,
            name
          )
        `)
        .eq("note_id", selectedNotes[0].id)
        .single();
      
      return data?.folder || null;
    },
    enabled: selectedNotes.length > 0,
  });

  // Fetch available folders
  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleNoteClick = (note: Note) => {
    if (isSelectionMode) {
      onNoteSelect(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
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
        notes={notes || []}
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