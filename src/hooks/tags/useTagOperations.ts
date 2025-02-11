
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTagOperations(tagId: string | undefined) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleEditStart = (currentName: string) => {
    setEditedName(currentName);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditedName("");
    setIsEditing(false);
  };

  const handleRename = async () => {
    if (!tagId || !editedName.trim()) {
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
      const { error: noteTagsError } = await supabase
        .from("notes_tags")
        .delete()
        .eq("tag_id", tagId);

      if (noteTagsError) throw noteTagsError;

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

  return {
    isEditing,
    editedName,
    setEditedName,
    handleEditStart,
    handleEditCancel,
    handleRename,
    handleDelete,
  };
}
