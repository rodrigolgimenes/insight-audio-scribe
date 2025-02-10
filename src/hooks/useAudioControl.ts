
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export const useAudioControl = (signedUrl: string | null, isPlaying: boolean, onPlayPause: () => void) => {
  const { toast } = useToast();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
            toast({
              title: "Error",
              description: "Failed to play audio",
              variant: "destructive",
            });
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume, isMuted, playbackRate, toast]);

  return {
    audioRef,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playbackRate,
    setPlaybackRate,
  };
};
