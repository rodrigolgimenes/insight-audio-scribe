
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useFolderActions } from "@/hooks/notes/useFolderActions";
import { useNoteSelection } from "@/hooks/notes/useNoteSelection";
import { useNoteActions } from "@/hooks/notes/useNoteActions";
import { useUncategorizedNotes } from "@/hooks/notes/useUncategorizedNotes";
import { useFoldersQuery } from "@/hooks/notes/useFoldersQuery";
import { UncategorizedHeader } from "@/components/folder/UncategorizedHeader";
import { UncategorizedContent } from "@/components/folder/UncategorizedContent";
import { Note } from "@/integrations/supabase/types/notes";

const UncategorizedFolder = () => {
  const { toast } = useToast();
  const { isSelectionMode, setIsSelectionMode, selectedNotes, setSelectedNotes } = useNoteSelection();
  const { handleDeleteNotes } = useNoteActions();
  const { data: notes, isLoading } = useUncategorizedNotes();
  const {
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder,
  } = useFolderActions();

  const { data: folders } = useFoldersQuery();

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.some((n) => n.id === note.id)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  const handleMoveNotes = () => {
    setIsFolderDialogOpen(true);
  };

  const handleSelectFolder = async (folderId: string) => {
    try {
      await handleMoveToFolder(selectedNotes, folderId);
      setSelectedNotes([]);
      setIsSelectionMode(false);
      setIsFolderDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Notes moved to folder successfully.",
      });
    } catch (error) {
      console.error("Error moving notes:", error);
      toast({
        title: "Error",
        description: "Failed to move notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="uncategorized" />
        <main className="flex-1 p-8">
          <UncategorizedHeader
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
          />

          <UncategorizedContent
            isLoading={isLoading}
            notes={notes}
            isSelectionMode={isSelectionMode}
            selectedNotes={selectedNotes}
            toggleNoteSelection={toggleNoteSelection}
            isFolderDialogOpen={isFolderDialogOpen}
            setIsFolderDialogOpen={setIsFolderDialogOpen}
            folders={folders || []}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            createNewFolder={createNewFolder}
            handleSelectFolder={handleSelectFolder}
            handleMoveNotes={handleMoveNotes}
            handleDeleteNotes={handleDeleteNotes}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UncategorizedFolder;
