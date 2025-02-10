
import { useRef } from "react";
import { AudioElement } from "./audio/AudioElement";
import { AudioProgressBar } from "./audio/AudioProgressBar";
import { useAudioState } from "@/hooks/useAudioState";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { PlayControls } from "./audio/PlayControls";
import { VolumeControls } from "./audio/VolumeControls";

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const AudioPlayer = ({ audioUrl, isPlaying, onPlayPause }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { duration, currentTime } = useAudioState(audioRef);
  useAudioPlayback(audioRef, isPlaying);

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
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
          <PlayControls isPlaying={isPlaying} onPlayPause={onPlayPause} />

          <div className="flex-1 min-w-[200px]">
            <AudioProgressBar 
              currentTime={currentTime}
              duration={duration}
              onProgressChange={handleProgressChange}
            />
          </div>

          <VolumeControls />
        </div>
      </div>
    </div>
  );
};
