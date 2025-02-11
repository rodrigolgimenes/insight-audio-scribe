import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useTagQuery } from "@/hooks/tags/useTagQuery";
import { useTagNotesQuery } from "@/hooks/tags/useTagNotesQuery";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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

export default function TagPage() {
  const { tagId } = useParams();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: tag, isLoading: isTagLoading } = useTagQuery(tagId);
  const { data: notes, isLoading: isNotesLoading } = useTagNotesQuery(tagId);

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleRename = async () => {
    if (!tagId || !editedName.trim() || editedName === tag?.name) {
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("tags")
        .update({ name: editedName.trim() })
        .eq("id", tagId);

      if (error) throw error;

      toast({
        title: "Tag renamed",
        description: "Tag has been renamed successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["tag", tagId] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error renaming tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!tagId) return;

    try {
      // First remove all associations between notes and this tag
      const { error: noteTagsError } = await supabase
        .from("notes_tags")
        .delete()
        .eq("tag_id", tagId);

      if (noteTagsError) throw noteTagsError;

      // Then delete the tag itself
      const { error: tagError } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId);

      if (tagError) throw tagError;

      toast({
        title: "Tag deleted",
        description: "Tag and all its associations have been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ["tags"] });
      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Error deleting tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isLoading = isTagLoading || isNotesLoading;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename();
                          if (e.key === "Escape") {
                            setEditedName(tag?.name || "");
                            setIsEditing(false);
                          }
                        }}
                        className="text-2xl font-semibold h-auto py-1 px-2"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleRename}
                        className="h-9 w-9"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditedName(tag?.name || "");
                          setIsEditing(false);
                        }}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-semibold text-gray-900">
                        Tag: {tag?.name}
                      </h1>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditedName(tag?.name || "");
                          setIsEditing(true);
                        }}
                        className="h-9 w-9"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-semibold text-center">
                              Delete Tag
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-gray-600">
                              Are you sure you want to delete this tag? This will remove the tag from all notes it's been assigned to.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              Delete tag
                            </AlertDialogAction>
                            <AlertDialogCancel className="w-full bg-white text-gray-600 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-colors border border-gray-200">
                              Cancel
                            </AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>

              {notes && notes.length > 0 ? (
                <FolderNotesGrid
                  notes={notes}
                  isSelectionMode={isSelectionMode}
                  selectedNotes={selectedNotes}
                  toggleNoteSelection={toggleNoteSelection}
                />
              ) : (
                <FolderEmptyState />
              )}
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
