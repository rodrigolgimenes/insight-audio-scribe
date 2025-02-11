
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface RecordSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keepAudio: boolean;
  onKeepAudioChange: (keep: boolean) => void;
  onSave: () => void;
}

export const RecordSettingsDialog = ({
  open,
  onOpenChange,
  keepAudio,
  onKeepAudioChange,
  onSave,
}: RecordSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Note options</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">Privacy</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Keep audio file</Label>
                <p className="text-sm text-muted-foreground">
                  Save your recording to listen to it after transcription.
                </p>
              </div>
              <Switch
                checked={keepAudio}
                onCheckedChange={onKeepAudioChange}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={onSave}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA]"
        >
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
};
