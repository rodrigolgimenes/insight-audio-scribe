
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (selectedFormats.length === 0) return;
    
    setIsExporting(true);
    try {
      // TODO: Implement export functionality
      console.log('Exporting files:', selectedIds, 'in formats:', selectedFormats);
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Files exported successfully",
        description: `${selectedIds.length} files have been exported in ${selectedFormats.length} format${selectedFormats.length > 1 ? 's' : ''}.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred while exporting files.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export {selectedIds.length} {selectedIds.length === 1 ? 'file' : 'files'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Select one or more formats to export your files:
            </div>
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
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={format.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFormats.length === 0 || isExporting}
            className="min-w-[80px]"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span>Export</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
