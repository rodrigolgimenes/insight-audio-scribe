
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useProjectOperations = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: renameProject, isPending: isRenaming } = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ name: newName })
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Project renamed",
        description: "The project name has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast({
        title: "Error renaming project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: async (deleteNotes: boolean) => {
      if (deleteNotes) {
        // Get all notes in the project
        const { data: notesInProject } = await supabase
          .from("notes_projects")
          .select("note_id")
          .eq("project_id", projectId);

        if (notesInProject) {
          // Delete all notes in the project
          for (const { note_id } of notesInProject) {
            await supabase.from("notes").delete().eq("id", note_id);
          }
        }
      } else {
        // Move notes to uncategorized by deleting their project association
        await supabase
          .from("notes_projects")
          .delete()
          .eq("project_id", projectId);
      }

      // Delete the project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Immediately navigate to dashboard after successful deletion
      navigate("/app", { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { 
    renameProject, 
    isRenaming, 
    deleteProject,
    isDeleting 
  };
};
