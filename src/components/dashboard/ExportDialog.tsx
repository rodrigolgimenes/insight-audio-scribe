
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
}

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF Document (.pdf)' },
  { id: 'txt', label: 'Text File (.txt)' },
  { id: 'docx', label: 'Word Document (.docx)' },
  { id: 'srt', label: 'Subtitles (.srt)' },
  { id: 'vtt', label: 'Web Video Text (.vtt)' },
];

export function ExportDialog({ open, onOpenChange, selectedIds }: ExportDialogProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  const handleExport = async () => {
    // TODO: Implement export functionality
    console.log('Exporting files:', selectedIds, 'in formats:', selectedFormats);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export {selectedIds.length} files</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-4">
            {EXPORT_FORMATS.map((format) => (
              <div key={format.id} className="flex items-center space-x-2">
                <Checkbox
                  id={format.id}
                  checked={selectedFormats.includes(format.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFormats([...selectedFormats, format.id]);
                    } else {
                      setSelectedFormats(selectedFormats.filter(f => f !== format.id));
                    }
                  }}
                />
                <label
                  htmlFor={format.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {format.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFormats.length === 0}
          >
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
