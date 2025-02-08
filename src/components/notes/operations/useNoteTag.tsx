
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useNoteTag = (noteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTagToNote = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("notes_tags")
        .insert({
          note_id: noteId,
          tag_id: tagId,
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["note-tags", noteId] });

      toast({
        title: "Tag added",
        description: "Tag has been added to the note.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { addTagToNote };
};
