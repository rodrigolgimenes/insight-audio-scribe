
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PlaybackSpeedControlProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

export const PlaybackSpeedControl = ({
  playbackRate,
  onPlaybackRateChange,
}: PlaybackSpeedControlProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPlaybackRateChange(Math.min(2, playbackRate + 0.5))}
        className="text-primary hover:bg-primary/10"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium">{playbackRate}x</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPlaybackRateChange(Math.max(0.5, playbackRate - 0.5))}
        className="text-primary hover:bg-primary/10"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
