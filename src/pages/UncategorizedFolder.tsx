
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useProjectActions } from "@/hooks/notes/useProjectActions";
import { useNoteSelection } from "@/hooks/notes/useNoteSelection";
import { useNoteActions } from "@/hooks/notes/useNoteActions";
import { useNotesQuery } from "@/hooks/notes/useNotesQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UncategorizedHeader } from "@/components/project/UncategorizedHeader";
import { UncategorizedContent } from "@/components/project/UncategorizedContent";

const UncategorizedFolder = () => {
  const { toast } = useToast();
  const { isSelectionMode, setIsSelectionMode, selectedNotes, setSelectedNotes } = useNoteSelection();
  const { handleDeleteNotes } = useNoteActions();
  const { data: notes, isLoading } = useNotesQuery();
  const {
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    newProjectName,
    setNewProjectName,
    createNewProject,
    handleMoveToProject,
  } = useProjectActions();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleNoteSelection = (noteId: string) => {
    const note = notes?.find((n) => n.id === noteId);
    if (!note) return;

    setSelectedNotes((prev) =>
      prev.some((n) => n.id === noteId)
        ? prev.filter((n) => n.id !== noteId)
        : [...prev, note]
    );
  };

  const handleMoveNotes = () => {
    setIsProjectDialogOpen(true);
  };

  const handleSelectProject = async (projectId: string) => {
    try {
      await handleMoveToProject(selectedNotes, projectId);
      setSelectedNotes([]);
      setIsSelectionMode(false);
      setIsProjectDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Notes moved to project successfully.",
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
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
          />

          <UncategorizedContent
            isLoading={isLoading}
            notes={notes}
            isSelectionMode={isSelectionMode}
            selectedNotes={selectedNotes}
            toggleNoteSelection={toggleNoteSelection}
            isProjectDialogOpen={isProjectDialogOpen}
            setIsProjectDialogOpen={setIsProjectDialogOpen}
            projects={projects || []}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            createNewProject={createNewProject}
            handleSelectProject={handleSelectProject}
            handleMoveNotes={handleMoveNotes}
            handleDeleteNotes={handleDeleteNotes}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UncategorizedFolder;
