
import { useAudioUrl } from "@/hooks/useAudioUrl";
import { useAudioControl } from "@/hooks/useAudioControl";
import { PlayPauseButton } from "./audio/PlayPauseButton";
import { VolumeControl } from "./audio/VolumeControl";
import { PlaybackSpeedControl } from "./audio/PlaybackSpeedControl";
import { DownloadButton } from "./audio/DownloadButton";
import { AudioElement } from "./audio/AudioElement";

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
  const { signedUrl, isAudioReady } = useAudioUrl(audioUrl);
  const {
    audioRef,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playbackRate,
    setPlaybackRate,
  } = useAudioControl(signedUrl, isPlaying, onPlayPause);

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border mb-4">
      <PlayPauseButton isPlaying={isPlaying} onPlayPause={onPlayPause} />

      <VolumeControl
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={(newVolume) => {
          setVolume(newVolume);
          setIsMuted(false);
        }}
        onMuteToggle={() => setIsMuted(!isMuted)}
      />

      <PlaybackSpeedControl
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
      />

      <DownloadButton
        publicUrl={audioUrl}
        isAudioReady={isAudioReady}
      />

      <AudioElement
        ref={audioRef}
        src={signedUrl || undefined}
        onEnded={onPlayPause}
      />
    </div>
  );
};
