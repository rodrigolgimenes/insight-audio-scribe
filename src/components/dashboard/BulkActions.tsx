
import { Button } from "@/components/ui/button";
import { FileDown, FolderOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { ExportDialog } from "./ExportDialog";

interface BulkActionsProps {
  selectedCount: number;
  selectedIds: string[];
  onMove: () => void;
  onDelete: () => void;
}

export function BulkActions({
  selectedCount,
  selectedIds,
  onMove,
  onDelete
}: BulkActionsProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <>
      <div className="bg-white border-t shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {selectedCount} {selectedCount === 1 ? 'file' : 'files'} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={onMove}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Move
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <ExportDialog 
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        selectedIds={selectedIds}
      />
    </>
  );
}
