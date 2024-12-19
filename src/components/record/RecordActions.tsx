import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useState } from "react";
import { RecordSettingsDialog } from "./RecordSettingsDialog";
import { Style } from "@/types/styles";

interface RecordActionsProps {
  onSave: () => void;
  isSaving: boolean;
  isRecording: boolean;
  styles: Style[];
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  keepAudio: boolean;
  onKeepAudioChange: (keep: boolean) => void;
}

export const RecordActions = ({ 
  onSave, 
  isSaving, 
  isRecording,
  styles,
  selectedStyleId,
  onStyleSelect,
  keepAudio,
  onKeepAudioChange,
}: RecordActionsProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button 
        variant="outline" 
        className="gap-2 border-2 text-primary"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings className="w-4 h-4" />
        Settings
      </Button>
      <Button 
        className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
        onClick={onSave}
        disabled={!isRecording || isSaving}
      >
        {isSaving ? 'Saving...' : 'Create note'}
      </Button>

      <RecordSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        selectedStyleId={selectedStyleId}
        onStyleSelect={onStyleSelect}
        styles={styles}
        keepAudio={keepAudio}
        onKeepAudioChange={onKeepAudioChange}
        onSave={() => {
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
};