
import { useEffect } from "react";

export const useAudioPlayback = (
  audioRef: React.RefObject<HTMLAudioElement>,
  isPlaying: boolean
) => {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[useAudioPlayback] Audio ref not available for play/pause');
      return;
    }

    if (isPlaying) {
      console.log('[useAudioPlayback] Attempting to play audio:', {
        currentSrc: audio.currentSrc,
        readyState: audio.readyState,
        networkState: audio.networkState,
        duration: audio.duration,
        currentTime: audio.currentTime
      });
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("[useAudioPlayback] Error playing audio:", error);
        });
      }
    } else {
      console.log('[useAudioPlayback] Pausing audio:', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        networkState: audio.networkState
      });
      audio.pause();
    }
  }, [isPlaying]);
};
