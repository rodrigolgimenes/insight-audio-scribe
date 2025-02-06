import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { FolderDialog } from "@/components/dashboard/FolderDialog";
import { NotesGrid } from "@/components/dashboard/NotesGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Note } from "@/integrations/supabase/types/notes";

const Dashboard = () => {
  const { toast } = useToast();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const navigate = useNavigate();

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        throw error;
      }

      return data as Note[];
    },
  });

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.includes(note)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  const handleNoteClick = (note: Note) => {
    if (isSelectionMode) {
      toggleNoteSelection(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Folder name is required",
        description: "Please enter a name for the new folder.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "Please sign in to create folders.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("folders")
      .insert({ 
        name: newFolderName,
        user_id: user.id 
      });

    if (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error creating folder",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Folder created",
      description: "The new folder has been created successfully.",
    });
    setNewFolderName("");
    setIsFolderDialogOpen(false);
    refetch();
  };

  const handleMoveToFolder = async (folderId: string) => {
    for (const note of selectedNotes) {
      const { error } = await supabase
        .from("notes_folders")
        .insert({ note_id: note.id, folder_id: folderId });

      if (error) {
        console.error("Error moving note:", error);
        toast({
          title: "Error moving note",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Notes moved",
      description: "Selected notes have been moved to the folder.",
    });
    setIsSelectionMode(false);
    setSelectedNotes([]);
    refetch();
  };

  const handleDeleteNotes = async () => {
    for (const note of selectedNotes) {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error deleting note",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Notes deleted",
      description: "Selected notes have been deleted.",
    });
    setIsSelectionMode(false);
    setSelectedNotes([]);
    refetch();
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <SearchHeader
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
            />

            {isSelectionMode && selectedNotes.length > 0 && (
              <BulkActions
                selectedNotes={selectedNotes}
                onMoveToFolder={() => setIsFolderDialogOpen(true)}
                onDelete={handleDeleteNotes}
              />
            )}

            {isLoading ? (
              <div>Loading...</div>
            ) : notes && notes.length > 0 ? (
              <NotesGrid
                notes={notes}
                isSelectionMode={isSelectionMode}
                selectedNotes={selectedNotes}
                onNoteClick={handleNoteClick}
                onNoteSelect={toggleNoteSelection}
              />
            ) : (
              <EmptyState />
            )}

            <FolderDialog
              isOpen={isFolderDialogOpen}
              onOpenChange={setIsFolderDialogOpen}
              folders={[]}
              newFolderName={newFolderName}
              onNewFolderNameChange={setNewFolderName}
              onCreateNewFolder={createNewFolder}
              onSelectFolder={handleMoveToFolder}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;