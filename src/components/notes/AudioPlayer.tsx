
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/utils/formatDuration";
import { AudioElement } from "./audio/AudioElement";

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const AudioPlayer = ({ audioUrl, isPlaying, onPlayPause }: AudioPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
        if (audio.duration) {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
          console.log("Time update:", {
            currentTime: audio.currentTime,
            duration: audio.duration,
            progress: (audio.currentTime / audio.duration) * 100
          });
        }
      };

      const handleLoadedMetadata = () => {
        console.log("Audio metadata loaded:", {
          duration: audio.duration,
          currentTime: audio.currentTime
        });
        setDuration(audio.duration);
        setCurrentTime(0);
        setProgress(0);
      };

      const handleLoadedData = () => {
        console.log("Audio data loaded:", {
          duration: audio.duration,
          currentTime: audio.currentTime
        });
        setDuration(audio.duration);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('loadeddata', handleLoadedData);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [audioRef.current]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
      setCurrentTime(newTime);
      console.log("Progress changed:", {
        newTime,
        progress: value[0],
        duration
      });
    }
  };

  return (
    <div className="space-y-4">
      <AudioElement 
        ref={audioRef} 
        src={audioUrl || undefined}
        onEnded={() => onPlayPause()}
      />
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
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
          <div className="flex-1">
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
          <Volume2 className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};
