import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Trash, Speaker } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  isSystemAudio: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDelete: () => void;
  onPlay: () => void;
  onToggleSystemAudio: (checked: boolean) => void;
}

export const RecordControls = ({
  isRecording,
  isPaused,
  hasRecording,
  isSystemAudio,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDelete,
  onPlay,
  onToggleSystemAudio,
}: RecordControlsProps) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-center gap-6">
        <Button
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
          disabled={!hasRecording || isRecording}
          onClick={onPlay}
        >
          <Play className="w-6 h-6 text-primary" />
        </Button>
        
        {isRecording ? (
          <Button
            size="icon"
            variant="default"
            className="w-20 h-20 rounded-full bg-[#E91E63] hover:bg-[#D81B60]"
            onClick={isPaused ? onResumeRecording : onPauseRecording}
          >
            {isPaused ? <Play className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="default"
            className="w-20 h-20 rounded-full bg-[#E91E63] hover:bg-[#D81B60]"
            onClick={onStartRecording}
          >
            {isSystemAudio ? <Speaker className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </Button>
        )}
        
        <Button
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
          onClick={onDelete}
          disabled={isRecording}
        >
          <Trash className="w-6 h-6 text-primary" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="system-audio"
          checked={isSystemAudio}
          onCheckedChange={onToggleSystemAudio}
          disabled={isRecording}
        />
        <Label htmlFor="system-audio">Capturar áudio do sistema</Label>
      </div>
    </div>
  );
};