import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { FolderDialog } from "@/components/dashboard/FolderDialog";
import { Note } from "@/integrations/supabase/types/notes";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const Dashboard = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const navigate = useNavigate();

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

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

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.includes(note)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  const handleNoteClick = (note: Note) => {
    if (isSelectionMode) {
      toggleNoteSelection(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim() || !session?.user.id) return;

    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .insert({
        name: newFolderName.trim(),
        user_id: session.user.id,
      })
      .select()
      .single();

    if (folderError) {
      toast({
        title: "Error creating folder",
        description: folderError.message,
        variant: "destructive",
      });
      return;
    }

    await moveNotesToFolder(folder.id);
  };

  const moveNotesToFolder = async (folderId: string) => {
    try {
      for (const note of selectedNotes) {
        const { error: deleteError } = await supabase
          .from("notes_folders")
          .delete()
          .eq("note_id", note.id);

        if (deleteError) {
          toast({
            title: "Error removing old folder association",
            description: deleteError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: insertError } = await supabase
          .from("notes_folders")
          .insert({
            note_id: note.id,
            folder_id: folderId,
          });

        if (insertError) {
          toast({
            title: "Error moving note to new folder",
            description: insertError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      toast({
        title: "Success",
        description: "Notes moved to folder successfully",
      });
      setIsFolderDialogOpen(false);
      setSelectedNotes([]);
      setIsSelectionMode(false);
    } catch (error) {
      toast({
        title: "Error moving notes",
        description: "Failed to move notes to folder",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedNotes = async () => {
    try {
      for (const note of selectedNotes) {
        const { error: folderError } = await supabase
          .from("notes_folders")
          .delete()
          .eq("note_id", note.id);

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
          .eq("note_id", note.id);

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
          .eq("id", note.id);

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
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notes",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">My notes:</h1>
          
          <SearchHeader
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
          />

          {isSelectionMode && selectedNotes.length > 0 && (
            <BulkActions
              selectedNotes={selectedNotes}
              onMoveToFolder={() => setIsFolderDialogOpen(true)}
              onDelete={deleteSelectedNotes}
            />
          )}

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow relative"
                  onClick={() => handleNoteClick(note)}
                >
                  {isSelectionMode && (
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(note)}
                        onChange={() => toggleNoteSelection(note)}
                        className="h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <h3 className="font-medium mb-2">{note.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {note.original_transcript || "No transcript available"}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <Badge>Note</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg border border-dashed border-gray-300">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">No notes yet</h3>
                <p className="text-sm text-gray-500">
                  Start by recording or uploading an audio file.
                </p>
              </div>
            </div>
          )}

          <FolderDialog
            isOpen={isFolderDialogOpen}
            onOpenChange={setIsFolderDialogOpen}
            folders={folders || []}
            newFolderName={newFolderName}
            onNewFolderNameChange={setNewFolderName}
            onCreateNewFolder={createNewFolder}
            onSelectFolder={moveNotesToFolder}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;