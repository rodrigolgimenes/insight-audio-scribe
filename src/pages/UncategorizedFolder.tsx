
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { FolderDialog } from "@/components/dashboard/FolderDialog";
import { useFolderActions } from "@/hooks/notes/useFolderActions";
import { Note } from "@/integrations/supabase/types/notes";

interface NoteWithTags extends Note {
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

const UncategorizedFolder = () => {
  const [selectedNotes, setSelectedNotes] = useState<NoteWithTags[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { toast } = useToast();
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

  const { data: notes, isLoading } = useQuery({
    queryKey: ["uncategorized-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_without_folders")
        .select(`
          id,
          title,
          original_transcript,
          processed_content,
          full_prompt,
          created_at,
          updated_at,
          recording_id,
          user_id,
          duration,
          audio_url,
          tags (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as NoteWithTags[];
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

  const handleDeleteNotes = async () => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .in("id", selectedNotes.map(note => note.id));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Selected notes have been deleted.",
      });

      setSelectedNotes([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Error deleting notes:", error);
      toast({
        title: "Error",
        description: "Failed to delete notes. Please try again.",
        variant: "destructive",
      });
    }
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
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Uncategorized Notes
            </h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {isSelectionMode ? "Exit selection mode" : "Select multiple notes"}
                </span>
                <Switch
                  checked={isSelectionMode}
                  onCheckedChange={setIsSelectionMode}
                />
              </div>
            </div>
          </div>

          {isSelectionMode && selectedNotes.length > 0 && (
            <BulkActions
              selectedNotes={selectedNotes}
              onMoveToFolder={handleMoveNotes}
              onDelete={handleDeleteNotes}
            />
          )}

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
            <FolderNotesGrid
              notes={notes}
              isSelectionMode={isSelectionMode}
              selectedNotes={selectedNotes.map(note => note.id)}
              toggleNoteSelection={toggleNoteSelection}
            />
          ) : (
            <FolderEmptyState />
          )}

          <FolderDialog
            isOpen={isFolderDialogOpen}
            onOpenChange={setIsFolderDialogOpen}
            folders={folders || []}
            currentFolderId={null}
            newFolderName={newFolderName}
            onNewFolderNameChange={setNewFolderName}
            onCreateNewFolder={createNewFolder}
            onSelectFolder={handleSelectFolder}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UncategorizedFolder;
