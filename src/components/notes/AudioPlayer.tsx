
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
  const timeUpdateRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[AudioPlayer] Audio ref not available');
      return;
    }

    const handleTimeUpdate = () => {
      // Use RAF to throttle updates and improve performance
      cancelAnimationFrame(timeUpdateRef.current);
      timeUpdateRef.current = requestAnimationFrame(() => {
        setCurrentTime(audio.currentTime);
        console.log('[AudioPlayer] Time Update:', {
          currentTime: audio.currentTime,
          duration: audio.duration,
          progress: (audio.currentTime / audio.duration) * 100,
          isPlaying: !audio.paused,
          readyState: audio.readyState
        });
      });
    };

    const handleLoadedMetadata = () => {
      console.log('[AudioPlayer] Audio metadata loaded:', {
        duration: audio.duration,
        currentTime: audio.currentTime,
        readyState: audio.readyState,
        src: audio.src
      });
      setDuration(audio.duration);
    };

    const handleDurationChange = () => {
      console.log('[AudioPlayer] Duration changed:', {
        duration: audio.duration,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc
      });
      setDuration(audio.duration);
    };

    const handleWaiting = () => {
      console.log('[AudioPlayer] Audio waiting event:', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        paused: audio.paused
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      cancelAnimationFrame(timeUpdateRef.current);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, []); // Run once on mount

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      console.log('[AudioPlayer] Attempting to play audio:', {
        currentSrc: audio.currentSrc,
        readyState: audio.readyState,
        duration: audio.duration,
        currentTime: audio.currentTime
      });
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("[AudioPlayer] Error playing audio:", error);
        });
      }
    } else {
      console.log('[AudioPlayer] Pausing audio:', {
        currentTime: audio.currentTime,
        duration: audio.duration
      });
      audio.pause();
    }
  }, [isPlaying]);

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    console.log('[AudioPlayer] Progress Change:', {
      newTime,
      progressValue: value[0],
      readyState: audio.readyState,
      duration: audio.duration
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
