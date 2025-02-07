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
import { NoteCardActions } from "./NoteCardActions";
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
  const { deleteNote, renameNote, isRenaming: isRenamingNote } = useNoteOperations(note.id);

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
        .single();
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
      // Remove from current folder if exists
      await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", note.id);

      // Add to new folder
      await supabase
        .from("notes_folders")
        .insert({
          note_id: note.id,
          folder_id: folderId,
        });

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
      />

      <NoteCardContent
        transcript={note.original_transcript}
        duration={note.duration}
        createdAt={note.created_at}
      />

      {!isSelectionMode && (
        <NoteCardActions
          onRename={() => setIsRenaming(true)}
          onMove={() => setIsMoveDialogOpen(true)}
          onDelete={handleDelete}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      )}

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