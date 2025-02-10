
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
      console.log('[AudioPlayer] Audio ref not available on mount');
      return;
    }

    const handleTimeUpdate = () => {
      // Use RAF to throttle updates
      cancelAnimationFrame(timeUpdateRef.current);
      timeUpdateRef.current = requestAnimationFrame(() => {
        if (!audio) return;
        
        setCurrentTime(audio.currentTime);
        console.log('[AudioPlayer] Time Update:', {
          currentTime: audio.currentTime,
          duration: audio.duration,
          progress: (audio.currentTime / audio.duration) * 100,
          isPlaying: !audio.paused,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
      });
    };

    const handleLoadedMetadata = () => {
      if (!audio) return;
      console.log('[AudioPlayer] Audio metadata loaded:', {
        duration: audio.duration,
        currentTime: audio.currentTime,
        readyState: audio.readyState,
        src: audio.src,
        networkState: audio.networkState
      });
      setDuration(audio.duration);
    };

    const handleDurationChange = () => {
      if (!audio) return;
      console.log('[AudioPlayer] Duration changed:', {
        duration: audio.duration,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc,
        networkState: audio.networkState
      });
      setDuration(audio.duration);
    };

    const handleWaiting = () => {
      if (!audio) return;
      console.log('[AudioPlayer] Audio waiting event:', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        paused: audio.paused,
        currentTime: audio.currentTime,
        duration: audio.duration
      });
    };

    const handleError = () => {
      if (!audio || !audio.error) return;
      console.error('[AudioPlayer] Audio error:', {
        code: audio.error.code,
        message: audio.error.message,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
    };

    const handleLoadStart = () => {
      if (!audio) return;
      console.log('[AudioPlayer] Load started:', {
        src: audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    // Cleanup function
    return () => {
      cancelAnimationFrame(timeUpdateRef.current);
      if (!audio) return;
      
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []); // Empty dependency array to ensure listeners are set up once on mount

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[AudioPlayer] Audio ref not available for play/pause');
      return;
    }

    if (isPlaying) {
      console.log('[AudioPlayer] Attempting to play audio:', {
        currentSrc: audio.currentSrc,
        readyState: audio.readyState,
        networkState: audio.networkState,
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
        duration: audio.duration,
        networkState: audio.networkState
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
      duration: audio.duration,
      networkState: audio.networkState
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
