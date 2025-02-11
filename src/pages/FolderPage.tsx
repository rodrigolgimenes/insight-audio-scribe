
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileText, Search, Trash2, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDuration } from "@/utils/formatDuration";
import { formatDate } from "@/utils/formatDate";
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
            duration,
            notes_tags!left (
              tags:tag_id (
                id,
                name,
                color
              )
            )
          )
        `)
        .eq("folder_id", folderId);

      if (error) throw error;
      return data.map((item) => ({
        ...item.note,
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
          <h1 className="text-2xl font-bold mb-6">{folder?.name}</h1>
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
            {tags && tags.length > 0 && (
              <div className="flex gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary"
                    style={{ backgroundColor: tag.color }}
                    className="text-white"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Select notes</span>
              <Switch
                checked={isSelectionMode}
                onCheckedChange={setIsSelectionMode}
              />
            </div>
            {isSelectionMode && selectedNotes.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Notes</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedNotes.length} selected notes? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteSelectedNotes}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow relative"
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
                    {note.original_transcript || "No transcript available"}
                  </p>
                  <div className="mt-4 space-y-2">
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map((tag) => (
                          <Badge 
                            key={tag.id}
                            style={{ backgroundColor: tag.color }}
                            className="text-white"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(note.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <Badge>Note</Badge>
                    </div>
                  </div>
                </div>
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
