import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectActions } from "@/components/project/ProjectActions";
import { ProjectEmptyState } from "@/components/project/ProjectEmptyState";
import { ProjectNotesGrid } from "@/components/project/ProjectNotesGrid";
import { ProjectDetails } from "@/components/project/ProjectDetails";
import { useProjectQuery } from "@/hooks/project/useProjectQuery";
import { useProjectNotesQuery } from "@/hooks/project/useProjectNotesQuery";
import { useProjectNoteSelection } from "@/hooks/project/useProjectNoteSelection";
import { useProjectOperations } from "@/hooks/project/useProjectOperations";
import { useProjectEmbeddings } from "@/hooks/useProjectEmbeddings";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Note } from "@/integrations/supabase/types/notes";

const ProjectPage = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  
  const { data: project, isLoading: projectLoading } = useProjectQuery(projectId);
  const { data: notes, isLoading: notesLoading } = useProjectNotesQuery(projectId);
  const { 
    renameProject, 
    isRenaming, 
    deleteProject,
    isDeleting 
  } = useProjectOperations(projectId || '');
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    deleteSelectedNotes,
  } = useProjectNoteSelection();
  const { ensureEmbeddings } = useProjectEmbeddings();

  // Refetch data when component mounts or becomes active
  useEffect(() => {
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["project-notes", projectId] });
      
      // Ensure the project has embeddings generated
      ensureEmbeddings(projectId);
    }
  }, [queryClient, projectId, ensureEmbeddings]);

  const projectTags = notes?.reduce((acc: any[], note) => {
    note.notes_tags?.forEach((noteTag: any) => {
      const tag = noteTag.tags;
      if (tag && !acc.some(existingTag => existingTag.id === tag.id)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []) || [];

  const isLoading = projectLoading || notesLoading;

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
    duration: note.duration || null,
    audio_url: null, // Since it's not in the query, set to null
    status: 'completed' as const, // Default status to completed with type assertion
    processing_progress: 100, // Default to 100% complete
    error_message: null, // Default to no error
    tags: note.tags ? note.tags.map((tag: any) => ({
      id: tag.id || '',
      name: tag.name || '',
      color: tag.color || null
    })) : []
  })) || [];
  
  // Create wrapper functions to handle the function arguments
  const handleRename = () => {
    // This function will call renameProject with appropriate arguments when needed
    if (project) {
      const newName = window.prompt("Enter new project name:", project.name);
      if (newName && newName !== project.name) {
        renameProject(newName);
      }
    }
  };
  
  const handleDelete = () => {
    // This function will call deleteProject with appropriate arguments when needed
    const confirmDelete = window.confirm("Are you sure you want to delete this project? This action cannot be undone.");
    if (confirmDelete) {
      deleteProject(false); // Default to not deleting notes
    }
  };

  // Create a wrapper function for toggleNoteSelection
  const handleToggleNoteSelection = (noteId: string) => {
    toggleNoteSelection(noteId);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8 overflow-auto">
          <ProjectHeader 
            projectName={project?.name || ""} 
            projectId={projectId || ''}
            onRename={handleRename}
            onDelete={handleDelete}
            isRenaming={isRenaming}
            isDeleting={isDeleting}
          />
          
          {project && <ProjectDetails project={project} />}
          
          <ProjectActions
            tags={projectTags}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            selectedNotes={selectedNotes}
            onDeleteSelected={deleteSelectedNotes}
          />

          {isLoading ? (
            <div>Loading...</div>
          ) : transformedNotes.length > 0 ? (
            <ProjectNotesGrid
              notes={transformedNotes}
              isSelectionMode={isSelectionMode}
              selectedNotes={selectedNotes}
              toggleNoteSelection={handleToggleNoteSelection}
            />
          ) : (
            <ProjectEmptyState />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProjectPage;
