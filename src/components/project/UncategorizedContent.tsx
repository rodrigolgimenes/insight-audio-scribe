
import { ProjectNotesGrid } from "@/components/project/ProjectNotesGrid";
import { ProjectEmptyState } from "@/components/project/ProjectEmptyState";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { ProjectDialog } from "@/components/dashboard/ProjectDialog";
import { Note } from "@/integrations/supabase/types/notes";

interface UncategorizedContentProps {
  isLoading: boolean;
  notes: Note[] | undefined;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  toggleNoteSelection: (note: Note) => void;
  isProjectDialogOpen: boolean;
  setIsProjectDialogOpen: (value: boolean) => void;
  projects: any[];
  newProjectName: string;
  setNewProjectName: (value: string) => void;
  createNewProject: () => Promise<void>;
  handleSelectProject: (projectId: string) => Promise<void>;
  handleMoveNotes: () => void;
  handleDeleteNotes: (notes: Note[]) => void;
}

export const UncategorizedContent = ({
  isLoading,
  notes,
  isSelectionMode,
  selectedNotes,
  toggleNoteSelection,
  isProjectDialogOpen,
  setIsProjectDialogOpen,
  projects,
  newProjectName,
  setNewProjectName,
  createNewProject,
  handleSelectProject,
  handleMoveNotes,
  handleDeleteNotes,
}: UncategorizedContentProps) => {
  return (
    <>
      {isSelectionMode && selectedNotes.length > 0 && (
        <BulkActions
          selectedCount={selectedNotes.length}
          onExport={() => setIsProjectDialogOpen(true)}
          onMove={handleMoveNotes}
          onDelete={() => handleDeleteNotes(selectedNotes)}
        />
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : notes && notes.length > 0 ? (
        <ProjectNotesGrid
          notes={notes}
          isSelectionMode={isSelectionMode}
          selectedNotes={selectedNotes.map(note => note.id)}
          toggleNoteSelection={(noteId: string) => {
            const note = notes.find(n => n.id === noteId);
            if (note) toggleNoteSelection(note);
          }}
        />
      ) : (
        <ProjectEmptyState />
      )}

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        projects={projects}
        currentProjectId={null}
        newProjectName={newProjectName}
        onNewProjectNameChange={setNewProjectName}
        onCreateNewProject={createNewProject}
        onSelectProject={handleSelectProject}
      />
    </>
  );
};
