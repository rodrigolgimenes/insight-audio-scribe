import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, ChevronRight, ChevronDown, Folder } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function FolderList() {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const { data: folders, refetch: refetchFolders } = useQuery({
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

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      name: newFolderName.trim(),
    });

    if (error) {
      toast({
        title: "Error creating folder",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Folder created",
      description: "Your folder has been created successfully.",
    });

    setNewFolderName("");
    setIsCreating(false);
    refetchFolders();
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
            size="sm"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createFolder();
              if (e.key === "Escape") setIsCreating(false);
            }}
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
              onClick={() => setIsCreating(false)}
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
          >
            <Folder className="h-4 w-4" />
            <span>{folder.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}