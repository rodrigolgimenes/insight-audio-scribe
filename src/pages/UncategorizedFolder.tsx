
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";

const UncategorizedFolder = () => {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
        `);

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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Uncategorized Notes
            </h1>
          </div>

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
