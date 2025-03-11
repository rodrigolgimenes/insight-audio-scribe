
import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FolderHeader } from "@/components/folder/FolderHeader";
import { FolderActions } from "@/components/folder/FolderActions";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { useFolderQuery } from "@/hooks/folder/useFolderQuery";
import { useFolderNotesQuery } from "@/hooks/folder/useFolderNotesQuery";
import { useFolderNoteSelection } from "@/hooks/folder/useFolderNoteSelection";
import { useFolderOperations } from "@/hooks/folder/useFolderOperations";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Note } from "@/integrations/supabase/types/notes";

const FolderPage = () => {
  const { folderId } = useParams();
  const queryClient = useQueryClient();
  
  const { data: folder, isLoading: folderLoading } = useFolderQuery(folderId);
  const { data: notes, isLoading: notesLoading } = useFolderNotesQuery(folderId);
  const { 
    renameFolder, 
    isRenaming, 
    deleteFolder,
    isDeleting 
  } = useFolderOperations(folderId || '');
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    deleteSelectedNotes,
  } = useFolderNoteSelection();

  // Refetch data when component mounts or becomes active
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["folder-notes", folderId] });
  }, [queryClient, folderId]);

  const folderTags = notes?.reduce((acc: any[], note) => {
    note.notes_tags?.forEach((noteTag: any) => {
      const tag = noteTag.tags;
      if (tag && !acc.some(existingTag => existingTag.id === tag.id)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []) || [];

  const isLoading = folderLoading || notesLoading;

  // Transform notes to match the Note type
  const transformedNotes: Note[] = notes?.map(note => ({
    id: note.id,
    title: note.title || '',
    processed_content: '', // Since it's not in the query, set a default empty string
    original_transcript: note.original_transcript || null,
    full_prompt: null, // Since it's not in the query, set to null
    created_at: note.created_at,
    updated_at: note.created_at, // Use created_at as fallback since updated_at isn't in the query
    recording_id: note.id, // Use note.id as recording_id since it's not in the query
    user_id: 'anonymous', // Set a default value since it's not in the query
    duration: note.recordings?.duration || null,
    audio_url: null, // Since it's not in the query, set to null
    status: 'completed', // Default status to completed
    processing_progress: 100, // Default to 100% complete
    error_message: null, // Default to no error
    tags: note.notes_tags?.map(nt => nt.tags).filter(Boolean) || []
  })) || [];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <FolderHeader 
            folderName={folder?.name || ""} 
            folderId={folderId || ''}
            onRename={renameFolder}
            onDelete={deleteFolder}
            isRenaming={isRenaming}
            isDeleting={isDeleting}
          />
          
          <FolderActions
            tags={folderTags}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            selectedNotes={selectedNotes}
            onDeleteSelected={deleteSelectedNotes}
          />

          {isLoading ? (
            <div>Loading...</div>
          ) : transformedNotes.length > 0 ? (
            <FolderNotesGrid
              notes={transformedNotes}
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

export default FolderPage;
