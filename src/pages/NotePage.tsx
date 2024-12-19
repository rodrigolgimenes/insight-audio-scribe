import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { MoveNoteDialog } from "@/components/notes/MoveNoteDialog";
import { NoteHeader } from "@/components/notes/NoteHeader";
import { NoteContent } from "@/components/notes/NoteContent";
import { TagsDialog } from "@/components/notes/TagsDialog";

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*, notes_tags(tag_id), notes_folders(folder_id)")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: folders } = useQuery({
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

  const { data: currentFolder } = useQuery({
    queryKey: ["note-folder", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_folders")
        .select("folder_id")
        .eq("note_id", noteId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const moveNoteToFolder = async (folderId: string) => {
    if (!noteId) return;

    try {
      // First remove from current folder if any
      const { error: deleteError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (deleteError) {
        toast({
          title: "Error removing from current folder",
          description: deleteError.message,
          variant: "destructive",
        });
        return;
      }

      // Then add to new folder
      const { error: insertError } = await supabase
        .from("notes_folders")
        .insert({
          note_id: noteId,
          folder_id: folderId,
        });

      if (insertError) {
        toast({
          title: "Error moving note",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Note moved",
        description: "Note has been moved to the selected folder.",
      });
      
      setIsMoveDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error moving note",
        description: "Failed to move note to folder",
        variant: "destructive",
      });
    }
  };

  const addTagToNote = async (tagId: string) => {
    if (!noteId) return;

    try {
      const { error } = await supabase
        .from("notes_tags")
        .insert({
          note_id: noteId,
          tag_id: tagId,
        });

      if (error) {
        toast({
          title: "Error adding tag",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSelectedTags([...selectedTags, tagId]);
      toast({
        title: "Tag added",
        description: "Tag has been added to the note.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async () => {
    if (!noteId) return;

    try {
      // First delete folder associations
      const { error: folderError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (folderError) {
        toast({
          title: "Error deleting folder associations",
          description: folderError.message,
          variant: "destructive",
        });
        return;
      }

      // Then delete tag associations
      const { error: tagError } = await supabase
        .from("notes_tags")
        .delete()
        .eq("note_id", noteId);

      if (tagError) {
        toast({
          title: "Error deleting tag associations",
          description: tagError.message,
          variant: "destructive",
        });
        return;
      }

      // Finally delete the note
      const { error: noteError } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (noteError) {
        toast({
          title: "Error deleting note",
          description: noteError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });

      navigate("/app");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  if (isLoadingNote) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <NoteHeader
            title={note?.title}
            onOpenTagsDialog={() => setIsTagsDialogOpen(true)}
            onOpenMoveDialog={() => setIsMoveDialogOpen(true)}
            onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
          />
          
          <NoteContent 
            title={note?.title || ''} 
            processed_content={note?.processed_content || ''} 
          />

          <MoveNoteDialog
            isOpen={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            folders={folders || []}
            currentFolderId={currentFolder?.folder_id || null}
            onMoveToFolder={moveNoteToFolder}
          />

          <TagsDialog
            isOpen={isTagsDialogOpen}
            onOpenChange={setIsTagsDialogOpen}
            onAddTag={addTagToNote}
            selectedTags={selectedTags}
          />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteNote}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default NotePage;
