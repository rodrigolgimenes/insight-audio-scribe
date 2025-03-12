
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordingActionsProps {
  showDeleteButton: boolean;
  handleDelete?: () => void;
  audioUrl: string | null;
}

export const RecordingActions = ({
  showDeleteButton,
  handleDelete,
  audioUrl
}: RecordingActionsProps) => {
  if (!showDeleteButton || !handleDelete || !audioUrl) {
    return null;
  }

  return (
    <div className="flex justify-center mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete recording
      </Button>
    </div>
  );
};
