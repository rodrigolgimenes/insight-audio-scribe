
import { Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TagsDialog } from "./TagsDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface NoteTagsProps {
  noteId: string;
}

export const NoteTags = ({ noteId }: NoteTagsProps) => {
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tags, refetch: refetchTags } = useQuery({
    queryKey: ["note-tags", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*, notes_tags!inner(note_id)")
        .eq("notes_tags.note_id", noteId);

      if (error) throw error;
      return data;
    },
    enabled: !!noteId,
  });

  const handleRemoveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("notes_tags")
        .delete()
        .eq("note_id", noteId)
        .eq("tag_id", tagId);

      if (error) throw error;

      toast({
        title: "Tag removed",
        description: "Tag has been removed from the note.",
      });

      refetchTags();
    } catch (error: any) {
      toast({
        title: "Error removing tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("notes_tags")
        .insert({
          note_id: noteId,
          tag_id: tagId,
        });

      if (error) throw error;

      toast({
        title: "Tag added",
        description: "Tag has been added to the note.",
      });

      refetchTags();
    } catch (error: any) {
      toast({
        title: "Error adding tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => setIsTagsDialogOpen(true)}
      >
        <TagIcon className="w-4 h-4 mr-2" />
        Add Tag
      </Button>
      <div className="flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <div
            key={tag.id}
            className="group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
          >
            <TagIcon className="w-3 h-3 mr-1" style={{ color: tag.color }} />
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            >
              <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>

      <TagsDialog
        isOpen={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
        onAddTag={handleAddTag}
        selectedTags={tags?.map(tag => tag.id) || []}
      />
    </div>
  );
};
