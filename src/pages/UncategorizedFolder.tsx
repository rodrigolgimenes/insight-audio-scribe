
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { Switch } from "@/components/ui/switch";
import { FolderActions } from "@/components/folder/FolderActions";
import { useToast } from "@/hooks/use-toast";

const UncategorizedFolder = () => {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { toast } = useToast();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["uncategorized-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_without_folders")
        .select(`
          id,
          title,
          original_transcript,
          created_at,
          duration,
          tags (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleDeleteNotes = async () => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .in("id", selectedNotes);

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
                <span className="text-sm text-gray-600">Select notes</span>
                <Switch
                  checked={isSelectionMode}
                  onCheckedChange={setIsSelectionMode}
                />
              </div>
            </div>
          </div>

          {isSelectionMode && selectedNotes.length > 0 && (
            <FolderActions
              tags={[]}
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
              selectedNotes={selectedNotes}
              onDeleteSelected={handleDeleteNotes}
            />
          )}

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
            <FolderNotesGrid
              notes={notes}
              isSelectionMode={isSelectionMode}
              selectedNotes={selectedNotes}
              toggleNoteSelection={toggleNoteSelection}
            />
          ) : (
            <FolderEmptyState />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UncategorizedFolder;
