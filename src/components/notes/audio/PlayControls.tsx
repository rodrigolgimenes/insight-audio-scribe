
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface PlayControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const PlayControls = ({ isPlaying, onPlayPause }: PlayControlsProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onPlayPause}
      className="w-8 h-8 p-0"
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
};
