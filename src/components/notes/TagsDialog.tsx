
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface TagsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTag: (tagId: string) => void;
  selectedTags: string[];
}

export const TagsDialog = ({
  isOpen,
  onOpenChange,
  onAddTag,
  selectedTags,
}: TagsDialogProps) => {
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

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

  const handleAddTag = (tagId: string) => {
    onAddTag(tagId);
    onOpenChange(false); // Close the dialog after adding tag
  };

  const createTag = async () => {
    if (!newTagName.trim() || !session?.user.id) return;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          name: newTagName.trim(),
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Tag created",
        description: "Your tag has been created successfully.",
      });

      // Add the newly created tag to the note
      if (data) {
        onAddTag(data.id);
      }

      setNewTagName("");
      setIsCreating(false);
      refetchTags();
    } catch (error: any) {
      toast({
        title: "Error creating tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add tags to note:</DialogTitle>
        </DialogHeader>

        {/* Quick tag creation input */}
        <div className="space-y-2">
          {isCreating ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type tag name and press Enter"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createTag();
                  } else if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewTagName("");
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add new tag
            </Button>
          )}
        </div>

        <div className="space-y-2 mt-4">
          {tags?.map((tag) => (
            <Button
              key={tag.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAddTag(tag.id)}
              disabled={selectedTags.includes(tag.id)}
            >
              <Tag
                className="w-4 h-4 mr-2"
                style={{ color: tag.color }}
              />
              {tag.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
