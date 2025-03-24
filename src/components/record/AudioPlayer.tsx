
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  audioUrl: string;
  showPlayButton?: boolean;
}

export function AudioPlayer({ audioUrl, showPlayButton = true }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    // Clean up
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
      audioRef.current = null;
    };
  }, [audioUrl]);
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const seekTime = value[0];
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        {showPlayButton && (
          <Button
            onClick={togglePlayPause}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      <Slider
        value={[currentTime]}
        min={0}
        max={duration || 100}
        step={0.1}
        onValueChange={handleSeek}
        className="w-full"
      />
      
      <audio className="hidden" src={audioUrl} />
    </div>
  );
}
