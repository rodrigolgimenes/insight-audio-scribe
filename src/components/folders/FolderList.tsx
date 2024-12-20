import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Folder } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export function FolderList() {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: folders, refetch: refetchFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching folders:", error);
        toast({
          title: "Error",
          description: "Failed to load folders. Please try again.",
          variant: "destructive",
        });
        return [];
      }
      return data || [];
    },
  });

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create folders",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({
          name: newFolderName.trim(),
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating folder:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Folder created successfully",
      });

      setNewFolderName("");
      setIsCreating(false);
      await refetchFolders();
      
      // Navigate to the new folder
      if (data) {
        navigate(`/app/folder/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error creating folder",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium text-gray-500">FOLDERS</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => setIsCreating(true)}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <div className="px-2 space-y-2">
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createFolder();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewFolderName("");
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={createFolder}
            >
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {folders?.map((folder) => (
          <div
            key={folder.id}
            className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
            onClick={() => navigate(`/app/folder/${folder.id}`)}
          >
            <Folder className="h-4 w-4" />
            <span>{folder.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}