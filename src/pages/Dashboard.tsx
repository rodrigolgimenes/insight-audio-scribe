import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { FolderDialog } from "@/components/dashboard/FolderDialog";
import { NoteList } from "@/components/dashboard/NoteList";
import { Note } from "@/integrations/supabase/types/notes";

const Dashboard = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: folders } = useQuery({
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

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.includes(note)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim() || !session?.user.id) return;

    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .insert({
        name: newFolderName.trim(),
        user_id: session.user.id,
      })
      .select()
      .single();

    if (folderError) {
      toast({
        title: "Error creating folder",
        description: folderError.message,
        variant: "destructive",
      });
      return;
    }

    await moveNotesToFolder(folder.id);
  };

  const moveNotesToFolder = async (folderId: string) => {
    try {
      for (const note of selectedNotes) {
        const { error: deleteError } = await supabase
          .from("notes_folders")
          .delete()
          .eq("note_id", note.id);

        if (deleteError) {
          toast({
            title: "Error removing old folder association",
            description: deleteError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: insertError } = await supabase
          .from("notes_folders")
          .insert({
            note_id: note.id,
            folder_id: folderId,
          });

        if (insertError) {
          toast({
            title: "Error moving note to new folder",
            description: insertError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      toast({
        title: "Success",
        description: "Notes moved to folder successfully",
      });
      setIsFolderDialogOpen(false);
      setSelectedNotes([]);
      setIsSelectionMode(false);
    } catch (error) {
      toast({
        title: "Error moving notes",
        description: "Failed to move notes to folder",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedNotes = async () => {
    try {
      for (const note of selectedNotes) {
        const { error: folderError } = await supabase
          .from("notes_folders")
          .delete()
          .eq("note_id", note.id);

        if (folderError) {
          toast({
            title: "Error deleting folder associations",
            description: folderError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: tagError } = await supabase
          .from("notes_tags")
          .delete()
          .eq("note_id", note.id);

        if (tagError) {
          toast({
            title: "Error deleting tag associations",
            description: tagError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: noteError } = await supabase
          .from("notes")
          .delete()
          .eq("id", note.id);

        if (noteError) {
          toast({
            title: "Error deleting note",
            description: noteError.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Notes deleted",
        description: "Selected notes have been deleted successfully.",
      });

      setSelectedNotes([]);
      setIsSelectionMode(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notes",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">My notes:</h1>
          
          <SearchHeader
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
          />

          {isSelectionMode && selectedNotes.length > 0 && (
            <BulkActions
              selectedNotes={selectedNotes}
              onMoveToFolder={() => setIsFolderDialogOpen(true)}
              onDelete={deleteSelectedNotes}
            />
          )}

          <NoteList
            notes={notes || []}
            isLoading={isLoading}
            isSelectionMode={isSelectionMode}
            selectedNotes={selectedNotes}
            onSelect={toggleNoteSelection}
          />

          <FolderDialog
            isOpen={isFolderDialogOpen}
            onOpenChange={setIsFolderDialogOpen}
            folders={folders || []}
            newFolderName={newFolderName}
            onNewFolderNameChange={setNewFolderName}
            onCreateNewFolder={createNewFolder}
            onSelectFolder={moveNotesToFolder}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
