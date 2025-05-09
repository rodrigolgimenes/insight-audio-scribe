
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Folder } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export function ProjectList() {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name", { ascending: true }); // Ordenação alfabética por nome

      if (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
        return [];
      }
      return data || [];
    },
  });

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create projects",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProjectName.trim(),
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setNewProjectName("");
      setIsCreating(false);
      await refetchProjects();
      
      // Navigate to the new project
      if (data) {
        navigate(`/app/project/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium text-gray-500">PROJECTS</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => setIsCreating(true)}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      <div 
        className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
        onClick={() => navigate("/app/uncategorized")}
      >
        <Folder className="h-4 w-4" />
        <span>Uncategorized</span>
      </div>

      {isCreating && (
        <div className="px-2 space-y-2">
          <Input
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createProject();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewProjectName("");
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={createProject}
            >
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsCreating(false);
                setNewProjectName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {projects?.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
            onClick={() => navigate(`/app/project/${project.id}`)}
          >
            <Folder className="h-4 w-4" />
            <span>{project.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
