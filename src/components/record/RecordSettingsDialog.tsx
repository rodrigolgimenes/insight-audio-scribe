import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Style } from "@/types/styles";

interface RecordSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  styles: Style[];
  keepAudio: boolean;
  onKeepAudioChange: (keep: boolean) => void;
  onSave: () => void;
}

export const RecordSettingsDialog = ({
  open,
  onOpenChange,
  selectedStyleId,
  onStyleSelect,
  styles,
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
            <h3 className="font-medium">Output</h3>
            
            <div className="space-y-2">
              <Label htmlFor="style">Style of the note:</Label>
              <Select value={selectedStyleId || undefined} onValueChange={onStyleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputLang">Input language (you speak in):</Label>
              <Select defaultValue="auto" disabled>
                <SelectTrigger>
                  <SelectValue>Auto</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputLang">Output Language:</Label>
              <Select defaultValue="auto" disabled>
                <SelectTrigger>
                  <SelectValue>Auto</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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