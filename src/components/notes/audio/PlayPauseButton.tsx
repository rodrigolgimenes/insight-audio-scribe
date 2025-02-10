
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const PlayPauseButton = ({ isPlaying, onPlayPause }: PlayPauseButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onPlayPause}
      className="text-primary hover:bg-primary/10"
    >
      {isPlaying ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Play className="h-5 w-5" />
      )}
    </Button>
  );
};
