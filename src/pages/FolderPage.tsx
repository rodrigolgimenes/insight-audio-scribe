
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

const FolderPage = () => {
  const { folderId } = useParams();
  
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

  const folderTags = notes?.reduce((acc: any[], note) => {
    note.tags.forEach((tag: any) => {
      if (!acc.some(existingTag => existingTag.id === tag.id)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []) || [];

  const isLoading = folderLoading || notesLoading;

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

export default FolderPage;
