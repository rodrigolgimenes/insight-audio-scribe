
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
}

export const VolumeControl = ({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
}: VolumeControlProps) => {
  return (
    <div className="flex items-center gap-2 w-32">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="text-primary hover:bg-primary/10"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
      <Slider
        value={[isMuted ? 0 : volume]}
        onValueChange={(newVolume) => onVolumeChange(newVolume[0])}
        max={1}
        step={0.1}
        className="w-20"
      />
    </div>
  );
};
