
import { Note } from "@/integrations/supabase/types/notes";
import { Card } from "@/components/ui/card";
import { CheckSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MoveNoteDialog } from "@/components/notes/MoveNoteDialog";
import { RenameNoteDialog } from "@/components/notes/RenameNoteDialog";
import { useNoteOperations } from "@/components/notes/NoteOperations";
import { NoteCardHeader } from "./NoteCardHeader";
import { NoteCardContent } from "./NoteCardContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface NoteCardProps {
  note: Note;
  isSelectionMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const NoteCard = ({ note, isSelectionMode, isSelected, onClick }: NoteCardProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { deleteNote, renameNote, isRenaming: isRenamingNote, moveNoteToProject } = useNoteOperations(note.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch current project for the note
  const { data: currentProject } = useQuery({
    queryKey: ["note-project", note.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notes_projects")
        .select(`
          project:projects (
            id,
            name
          )
        `)
        .eq("note_id", note.id)
        .maybeSingle();
      
      // Ensure we return an object with the correct shape, not an array
      return data?.project ? {
        id: (data.project as any).id as string,
        name: (data.project as any).name as string
      } : null;
    },
  });

  // Fetch available projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch note processing status with improved status handling
  const { data: noteStatus } = useQuery({
    queryKey: ["note-status", note.id],
    queryFn: async () => {
      // Fetch both note status and recording status
      const { data: noteData } = await supabase
        .from("notes")
        .select("id, status, processing_progress, original_transcript")
        .eq("id", note.id)
        .single();
      
      if (!noteData) return { status: 'processing', processing_progress: 0 };
      
      // If the note has a transcript but still shows as processing, update it to completed
      if (noteData.original_transcript && 
          (noteData.status === 'processing' || noteData.status === 'transcribing')) {
        
        // Update note status in database
        await supabase
          .from('notes')
          .update({ 
            status: 'completed',
            processing_progress: 100 
          })
          .eq('id', noteData.id);
        
        return { status: 'completed', processing_progress: 100 };
      }
      
      return noteData;
    },
    refetchInterval: (query) => {
      // If no data yet, refetch every 2 seconds
      if (!query.state.data) return 2000;
      // If processing is not complete, refetch every 2 seconds
      return (query.state.data.status !== 'completed' && query.state.data.status !== 'error') ? 2000 : false;
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && 
        (e.target.closest('[data-dropdown]') || 
         e.target.closest('[role="dialog"]'))) {
      return;
    }
    
    if (isSelectionMode) {
      onClick();
      return;
    }
    
    try {
      console.log("Navigating to note:", note.id);
      // Verify note ID before navigation
      if (!note.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(note.id)) {
        console.error("Invalid note ID format:", note.id);
        toast({
          title: "Navigation Error",
          description: "This note has an invalid ID and cannot be opened.",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure to include the full path
      navigate(`/app/notes/${note.id}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "Could not open this note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleRename = async (newTitle: string) => {
    try {
      await renameNote(newTitle);
      setIsRenaming(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error renaming note:', error);
    }
  };

  const handleMove = async (projectId: string) => {
    try {
      await moveNoteToProject(projectId);
      setIsMoveDialogOpen(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error moving note:', error);
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 relative",
        isSelectionMode && isSelected && "bg-gray-50 ring-2 ring-primary"
      )}
      onClick={handleCardClick}
    >
      {isSelectionMode && (
        <div className="absolute top-4 right-4">
          <CheckSquare 
            className={cn(
              "h-6 w-6",
              isSelected ? "text-primary" : "text-gray-300"
            )} 
          />
        </div>
      )}
      
      <NoteCardHeader
        title={note.title}
        isSelectionMode={isSelectionMode}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        onRename={() => setIsRenaming(true)}
        onMove={() => setIsMoveDialogOpen(true)}
        onDelete={handleDelete}
      />

      <NoteCardContent
        transcript={note.original_transcript}
        duration={note.duration}
        createdAt={note.created_at}
        folder={currentProject}
        status={noteStatus?.status}
        progress={noteStatus?.processing_progress}
        noteId={note.id}
      />

      <RenameNoteDialog
        isOpen={isRenaming}
        onOpenChange={setIsRenaming}
        currentTitle={note.title}
        onRename={handleRename}
        isRenaming={isRenamingNote}
      />

      <MoveNoteDialog
        isOpen={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        projects={projects}
        currentProjectId={currentProject?.id || null}
        onMoveToProject={handleMove}
      />
    </Card>
  );
};
