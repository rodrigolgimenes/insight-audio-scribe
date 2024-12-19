import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileText, Search, FolderPlus } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: notes, isLoading } = useQuery({
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

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
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
      // First, remove existing folder associations for these notes
      for (const noteId of selectedNotes) {
        const { error: deleteError } = await supabase
          .from("notes_folders")
          .delete()
          .eq("note_id", noteId);

        if (deleteError) {
          toast({
            title: "Error removing old folder association",
            description: deleteError.message,
            variant: "destructive",
          });
          return;
        }

        // Then create new folder association
        const { error: insertError } = await supabase
          .from("notes_folders")
          .insert({
            note_id: noteId,
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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">My notes:</h1>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                placeholder="Search notes..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex gap-2">
              <Badge variant="secondary">note</Badge>
              <Badge variant="secondary">tasklist</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Select notes</span>
              <Switch
                checked={isSelectionMode}
                onCheckedChange={setIsSelectionMode}
              />
            </div>
            {isSelectionMode && selectedNotes.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsFolderDialogOpen(true)}
              >
                Move to folder
              </Button>
            )}
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow relative ${
                    isSelectionMode ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    isSelectionMode
                      ? toggleNoteSelection(note.id)
                      : navigate(`/app/notes/${note.id}`)
                  }
                >
                  {isSelectionMode && (
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(note.id)}
                        onChange={() => toggleNoteSelection(note.id)}
                        className="h-4 w-4"
                      />
                    </div>
                  )}
                  <h3 className="font-medium mb-2">{note.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {note.content}
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
                <h3 className="text-lg font-medium text-gray-900">No notes</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Get started by creating a new note.
                </p>
                <Button
                  className="bg-[#E91E63] hover:bg-[#D81B60]"
                  onClick={() => navigate("/record")}
                >
                  + New Note
                </Button>
              </div>
            </div>
          )}
        </main>

        <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add notes to folder:</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {folders?.length === 0 && (
                <p className="text-center text-gray-500">No folders found</p>
              )}
              <div className="space-y-2">
                <Input
                  placeholder="New folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={createNewFolder}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create new folder
                </Button>
              </div>
              {folders?.map((folder) => (
                <Button
                  key={folder.id}
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => moveNotesToFolder(folder.id)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {folder.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;