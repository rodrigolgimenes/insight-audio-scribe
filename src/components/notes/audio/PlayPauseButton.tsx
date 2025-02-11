
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  disabled?: boolean;
}

export const PlayPauseButton = ({ isPlaying, onPlayPause, disabled }: PlayPauseButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onPlayPause}
      disabled={disabled}
      className="text-primary hover:bg-primary/10 disabled:opacity-50"
    >
      {isPlaying ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Play className="h-5 w-5" />
      )}
    </Button>
  );
};
