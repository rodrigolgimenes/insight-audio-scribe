
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: tags } = useQuery({
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add tags to note:</DialogTitle>
        </DialogHeader>
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
