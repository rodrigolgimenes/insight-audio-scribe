
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AudioElement } from "./audio/AudioElement";
import { AudioProgressBar } from "./audio/AudioProgressBar";

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const AudioPlayer = ({ audioUrl, isPlaying, onPlayPause }: AudioPlayerProps) => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      console.log('Time Update:', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        progress: (audio.currentTime / audio.duration) * 100,
        isPlaying: !audio.paused
      });
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        currentTime: audio.currentTime,
        readyState: audio.readyState
      });
      setDuration(audio.duration);
    };

    const handleDurationChange = () => {
      console.log('Duration changed:', {
        duration: audio.duration,
        readyState: audio.readyState
      });
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, []); // Run once on mount

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      console.log('Attempting to play audio:', {
        currentSrc: audio.currentSrc,
        readyState: audio.readyState
      });
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    } else {
      console.log('Pausing audio');
      audio.pause();
    }
  }, [isPlaying]);

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    console.log('Progress Change:', {
      newTime,
      progressValue: value[0],
      readyState: audio.readyState
    });
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
      <AudioElement 
        ref={audioRef} 
        src={audioUrl || undefined}
        onEnded={() => onPlayPause()}
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
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

          <div className="flex-1 min-w-[200px]">
            <AudioProgressBar 
              currentTime={currentTime}
              duration={duration}
              onProgressChange={handleProgressChange}
            />
          </div>

          <Volume2 className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};
