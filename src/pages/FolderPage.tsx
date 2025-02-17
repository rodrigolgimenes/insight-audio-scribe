
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
    note.tags?.forEach((tag: any) => {
      if (!acc.some(existingTag => existingTag.id === tag.id)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []) || [];

  const isLoading = folderLoading || notesLoading;

  // Transform notes to match the Note type
  const transformedNotes: Note[] = notes?.map(note => ({
    id: note.id,
    title: note.title,
    processed_content: note.processed_content || '',
    original_transcript: note.original_transcript,
    full_prompt: note.full_prompt || null,
    created_at: note.created_at,
    updated_at: note.updated_at || note.created_at,
    recording_id: note.recording_id || '',
    user_id: note.user_id || '',
    duration: note.recordings?.duration || null,
    audio_url: note.audio_url || null,
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
