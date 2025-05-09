
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useProjectActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Project name is required",
        description: "Please enter a name for the new project.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in to create projects.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("projects")
        .insert({ 
          name: newProjectName,
          user_id: user.id 
        });

      if (error) {
        console.error("Error creating project:", error);
        toast({
          title: "Error creating project",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Project created",
        description: "The new project was created successfully.",
      });
      setNewProjectName("");
      setIsProjectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      console.error("Error in createNewProject:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleMoveToProject = async (notes: Note[], projectId: string) => {
    try {
      console.log("Moving notes to project:", projectId);
      console.log("Selected notes:", notes);

      // Move each note to the new project using the move_note_to_project function
      for (const note of notes) {
        const { error } = await supabase
          .rpc('move_note_to_project', {
            p_note_id: note.id,
            p_project_id: projectId
          });

        if (error) {
          console.error("Error moving note:", error);
          throw error;
        }
      }

      // Invalidate queries to update the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["project-notes"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        ...notes.map(note => 
          queryClient.invalidateQueries({ queryKey: ["note-project", note.id] })
        )
      ]);

      toast({
        title: "Notes moved",
        description: "The selected notes were moved to the project.",
      });
      setIsProjectDialogOpen(false);
    } catch (error) {
      console.error("Error in handleMoveToProject:", error);
      toast({
        title: "Error",
        description: "Failed to move notes",
        variant: "destructive",
      });
    }
  };

  return {
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    newProjectName,
    setNewProjectName,
    createNewProject,
    handleMoveToProject,
  };
};
