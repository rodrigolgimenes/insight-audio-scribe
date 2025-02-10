
import { useState, useRef, useEffect } from "react";

interface AudioState {
  duration: number;
  currentTime: number;
  timeUpdateRef: React.MutableRefObject<number>;
}

export const useAudioState = (audioRef: React.RefObject<HTMLAudioElement>) => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const timeUpdateRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[useAudioState] Audio ref not available on mount');
      return;
    }

    const handleTimeUpdate = () => {
      cancelAnimationFrame(timeUpdateRef.current);
      timeUpdateRef.current = requestAnimationFrame(() => {
        if (!audio) return;
        
        setCurrentTime(audio.currentTime);
        console.log('[useAudioState] Time Update:', {
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
      console.log('[useAudioState] Audio metadata loaded:', {
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
      console.log('[useAudioState] Duration changed:', {
        duration: audio.duration,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc,
        networkState: audio.networkState
      });
      setDuration(audio.duration);
    };

    const handleWaiting = () => {
      if (!audio) return;
      console.log('[useAudioState] Audio waiting event:', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        paused: audio.paused,
        currentTime: audio.currentTime,
        duration: audio.duration
      });
    };

    const handleError = () => {
      if (!audio || !audio.error) return;
      console.error('[useAudioState] Audio error:', {
        code: audio.error.code,
        message: audio.error.message,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
    };

    const handleLoadStart = () => {
      if (!audio) return;
      console.log('[useAudioState] Load started:', {
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

  return {
    duration,
    currentTime,
    timeUpdateRef,
  };
};
