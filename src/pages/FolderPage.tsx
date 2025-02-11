
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { FolderHeader } from "@/components/folder/FolderHeader";
import { FolderActions } from "@/components/folder/FolderActions";
import { FolderNoteCard } from "@/components/folder/FolderNoteCard";

const FolderPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  const { data: folder, isLoading: folderLoading } = useQuery({
    queryKey: ["folder", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: notes, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_folders")
        .select(`
          note:notes (
            id,
            title,
            original_transcript,
            created_at,
            recordings (
              duration
            ),
            notes_tags!left (
              tags:tag_id (
                id,
                name,
                color
              )
            )
          )
        `)
        .eq("folder_id", folderId)
        .order('created_at', { ascending: false, foreignTable: 'notes' });

      if (error) throw error;
      return data.map((item) => ({
        ...item.note,
        duration: item.note.recordings?.duration || null,
        tags: item.note.notes_tags?.map((nt: any) => nt.tags) || []
      }));
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const deleteSelectedNotes = async () => {
    try {
      for (const noteId of selectedNotes) {
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
      }

      toast({
        title: "Notes deleted",
        description: "Selected notes have been deleted successfully.",
      });

      setSelectedNotes([]);
      setIsSelectionMode(false);
      refetchNotes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notes",
        variant: "destructive",
      });
    }
  };

  const isLoading = folderLoading || notesLoading;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <FolderHeader folderName={folder?.name || ""} />
          
          <FolderActions
            tags={tags || []}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            selectedNotes={selectedNotes}
            onDeleteSelected={deleteSelectedNotes}
          />

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <FolderNoteCard
                  key={note.id}
                  note={note}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedNotes.includes(note.id)}
                  onClick={() => navigate(`/app/notes/${note.id}`)}
                  onToggleSelection={() => toggleNoteSelection(note.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg border border-dashed border-gray-300">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">No notes in this folder</h3>
                <p className="text-sm text-gray-500">
                  Move some notes to this folder to see them here.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default FolderPage;
