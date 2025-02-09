
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  FastForward,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface AudioControlBarProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const AudioControlBar = ({
  audioUrl,
  isPlaying,
  onPlayPause,
}: AudioControlBarProps) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Log para debug
  console.log("AudioControlBar - Audio URL:", audioUrl);

  if (!audioUrl) {
    console.log("AudioControlBar - No audio URL provided");
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="text-primary"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2 w-32">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-primary"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={(newVolume) => {
              setVolume(newVolume[0]);
              setIsMuted(false);
            }}
            max={1}
            step={0.1}
            className="w-20"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const rates = [1, 1.5, 2];
            const currentIndex = rates.indexOf(playbackRate);
            const nextIndex = (currentIndex + 1) % rates.length;
            setPlaybackRate(rates[nextIndex]);
          }}
          className="text-primary min-w-[80px]"
        >
          <FastForward className="h-4 w-4 mr-2" />
          {playbackRate}x
        </Button>

        <Button variant="ghost" size="sm" asChild className="text-primary">
          <a href={audioUrl} download>
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
};
