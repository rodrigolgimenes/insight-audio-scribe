
import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useTagQuery } from "@/hooks/tags/useTagQuery";
import { useTagNotesQuery } from "@/hooks/tags/useTagNotesQuery";
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { TagHeader } from "@/components/tag/TagHeader";
import { TagContent } from "@/components/tag/TagContent";
import { useTagOperations } from "@/hooks/tags/useTagOperations";

export default function TagPage() {
  const { tagId } = useParams();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: tag, isLoading: isTagLoading } = useTagQuery(tagId);
  const { data: notes, isLoading: isNotesLoading } = useTagNotesQuery(tagId);
  const {
    isEditing,
    editedName,
    setEditedName,
    handleEditStart,
    handleEditCancel,
    handleRename,
    handleDelete,
  } = useTagOperations(tagId);

  // Set up real-time subscription for notes_tags changes
  useEffect(() => {
    if (!tagId) return;

    console.log("Setting up real-time subscription for tag:", tagId);
    
    const channel = supabase
      .channel('tag-notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes_tags',
          filter: `tag_id=eq.${tagId}`
        },
        async (payload) => {
          console.log("notes_tags change detected:", payload);
          await queryClient.invalidateQueries({ queryKey: ["tag-notes", tagId] });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [tagId, queryClient]);

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
              <TagHeader
                tag={tag}
                isEditing={isEditing}
                editedName={editedName}
                onEditStart={() => handleEditStart(tag?.name || "")}
                onEditChange={setEditedName}
                onEditSubmit={handleRename}
                onEditCancel={handleEditCancel}
                onDelete={handleDelete}
              />
              <TagContent
                notes={notes}
                isSelectionMode={isSelectionMode}
                selectedNotes={selectedNotes}
                toggleNoteSelection={toggleNoteSelection}
              />
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
