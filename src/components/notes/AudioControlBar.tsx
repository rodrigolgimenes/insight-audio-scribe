
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const getPublicUrl = async () => {
      if (audioUrl) {
        const { data } = supabase.storage
          .from('audio_recordings')
          .getPublicUrl(audioUrl);
        
        console.log('Public URL generated:', data.publicUrl);
        setPublicUrl(data.publicUrl);
      }
    };

    getPublicUrl();
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [isPlaying, volume, isMuted, playbackRate]);

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border mb-4">
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

      <div className="flex items-center gap-2 w-32">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
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
          onValueChange={(newVolume) => {
            setVolume(newVolume[0]);
            setIsMuted(false);
          }}
          max={1}
          step={0.1}
          className="w-20"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPlaybackRate(prev => Math.min(2, prev + 0.5))}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{playbackRate}x</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPlaybackRate(prev => Math.max(0.5, prev - 0.5))}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        asChild 
        className="text-primary hover:bg-primary/10"
        disabled={!publicUrl}
      >
        <a href={publicUrl || '#'} download>
          <Download className="h-4 w-4 mr-2" />
          Download
        </a>
      </Button>

      <audio
        ref={audioRef}
        src={publicUrl || undefined}
        onEnded={() => onPlayPause()}
      />
    </div>
  );
};
