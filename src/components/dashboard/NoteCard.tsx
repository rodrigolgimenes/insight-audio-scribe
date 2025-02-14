
import { Note } from "@/integrations/supabase/types/notes";
import { Card } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MoveNoteDialog } from "@/components/notes/MoveNoteDialog";
import { RenameNoteDialog } from "@/components/notes/RenameNoteDialog";
import { useNoteOperations } from "@/components/notes/NoteOperations";
import { NoteCardHeader } from "./NoteCardHeader";
import { NoteCardContent } from "./NoteCardContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { deleteNote, renameNote, isRenaming: isRenamingNote, moveNoteToFolder } = useNoteOperations(note.id);

  // Fetch current folder for the note
  const { data: currentFolder } = useQuery({
    queryKey: ["note-folder", note.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notes_folders")
        .select(`
          folder:folders (
            id,
            name
          )
        `)
        .eq("note_id", note.id)
        .maybeSingle();
      return data?.folder || null;
    },
  });

  // Fetch available folders
  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && 
        (e.target.closest('[data-dropdown]') || 
         e.target.closest('[role="dialog"]'))) {
      return;
    }
    onClick();
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

  const handleMove = async (folderId: string) => {
    try {
      await moveNoteToFolder(folderId);
      setIsMoveDialogOpen(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error moving note:', error);
    }
  };

  // Fetch note processing status
  const { data: noteStatus } = useQuery({
    queryKey: ["note-status", note.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notes")
        .select("status, processing_progress")
        .eq("id", note.id)
        .single();
      return data;
    },
    refetchInterval: (data) => {
      if (!data) return false;
      // Refetch every 2 seconds if the note is still processing
      return data.status !== 'completed' && data.status !== 'error' ? 2000 : false;
    },
  });

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
        folder={currentFolder}
        status={noteStatus?.status}
        progress={noteStatus?.processing_progress}
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
        folders={folders}
        currentFolderId={currentFolder?.id || null}
        onMoveToFolder={handleMove}
      />
    </Card>
  );
};
