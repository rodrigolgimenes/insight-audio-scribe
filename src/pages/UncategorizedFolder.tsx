
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useFolderActions } from "@/hooks/notes/useFolderActions";
import { useNoteSelection } from "@/hooks/notes/useNoteSelection";
import { useNoteActions } from "@/hooks/notes/useNoteActions";
import { useNotesQuery } from "@/hooks/notes/useNotesQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UncategorizedHeader } from "@/components/folder/UncategorizedHeader";
import { UncategorizedContent } from "@/components/folder/UncategorizedContent";

const UncategorizedFolder = () => {
  const { toast } = useToast();
  const { isSelectionMode, setIsSelectionMode, selectedNotes, setSelectedNotes } = useNoteSelection();
  const { handleDeleteNotes } = useNoteActions();
  const { data: notes, isLoading } = useNotesQuery();
  const {
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder,
  } = useFolderActions();

  const { data: folders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

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
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <UncategorizedHeader
            searchQuery=""
            setSearchQuery={() => {}}
          />

          <UncategorizedContent />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UncategorizedFolder;
