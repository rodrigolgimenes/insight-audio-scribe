
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export function TagList() {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: tags, refetch: refetchTags } = useQuery({
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

  const createTag = async () => {
    if (!newTagName.trim() || !session?.user.id) return;

    const { error } = await supabase.from("tags").insert({
      name: newTagName.trim(),
      user_id: session.user.id,
    });

    if (error) {
      toast({
        title: "Error creating tag",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Tag created",
      description: "Your tag has been created successfully.",
    });

    setNewTagName("");
    setIsCreating(false);
    refetchTags();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium text-gray-500">TAGS</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <div className="px-2 space-y-2">
          <Input
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createTag();
              if (e.key === "Escape") setIsCreating(false);
            }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={createTag}
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
        {tags?.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
            onClick={() => navigate(`/app/tag/${tag.id}`)}
          >
            <Tag className="h-4 w-4" style={{ color: tag.color }} />
            <span>{tag.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
