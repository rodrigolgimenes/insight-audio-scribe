import { useState } from "react";
import { StyleCard } from "./StyleCard";
import { StyleDialog } from "./StyleDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Style {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  category: string;
}

interface StylesListProps {
  styles: Style[];
}

export function StylesList({ styles }: StylesListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  const handleEdit = (style: Style) => {
    setEditingStyle(style);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingStyle(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="bg-[#E91E63] hover:bg-[#D81B60]">
          <Plus className="w-4 h-4 mr-2" />
          Create Style
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {styles.map((style) => (
          <StyleCard key={style.id} style={style} onEdit={() => handleEdit(style)} />
        ))}
      </div>

      <StyleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        style={editingStyle}
      />
    </div>
  );
}