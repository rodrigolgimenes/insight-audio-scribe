import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

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

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const addTagToNote = async (tagId: string) => {
    const { error } = await supabase.from("notes_tags").insert({
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
  };

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
          title: "Error removing old folder association",
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

      setSelectedFolder(folderId);
      toast({
        title: "Note moved",
        description: "Note has been moved to the selected folder.",
      });
    } catch (error) {
      toast({
        title: "Error moving note",
        description: "Failed to move note to folder",
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
          <div className="mb-6 flex justify-between items-center">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate("/app")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to notes
            </Button>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Tag className="w-4 h-4" />
                    Add Tags
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {tags?.map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => addTagToNote(tag.id)}
                    >
                      <Tag className="w-4 h-4 mr-2" style={{ color: tag.color }} />
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Folder className="w-4 h-4" />
                    Move to Folder
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {folders?.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => moveNoteToFolder(folder.id)}
                    >
                      <Folder className="w-4 h-4 mr-2" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{note?.title}</h1>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="whitespace-pre-wrap">{note?.content}</p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default NotePage;