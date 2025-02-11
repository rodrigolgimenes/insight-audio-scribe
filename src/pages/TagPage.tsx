
import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useTagQuery } from "@/hooks/tags/useTagQuery";
import { useTagNotesQuery } from "@/hooks/tags/useTagNotesQuery";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TagPage() {
  const { tagId } = useParams();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const { data: tag, isLoading: isTagLoading } = useTagQuery(tagId);
  const { data: notes, isLoading: isNotesLoading } = useTagNotesQuery(tagId);

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const isLoading = isTagLoading || isNotesLoading;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Tag: {tag?.name}
                </h1>
              </div>

              {notes && notes.length > 0 ? (
                <FolderNotesGrid
                  notes={notes}
                  isSelectionMode={isSelectionMode}
                  selectedNotes={selectedNotes}
                  toggleNoteSelection={toggleNoteSelection}
                />
              ) : (
                <FolderEmptyState />
              )}
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
