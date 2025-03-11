
import { useAudioUrl } from "@/hooks/useAudioUrl";
import { useAudioControl } from "@/hooks/useAudioControl";
import { PlayPauseButton } from "./audio/PlayPauseButton";
import { VolumeControl } from "./audio/VolumeControl";
import { PlaybackSpeedControl } from "./audio/PlaybackSpeedControl";
import { DownloadButton } from "./audio/DownloadButton";
import { AudioElement } from "./audio/AudioElement";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { signedUrl, isAudioReady, error, retry } = useAudioUrl(audioUrl);
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

  // Show error message if there's an issue loading the audio
  if (error) {
    return (
      <div className="flex items-center justify-between gap-4 bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Audio Loading Error</p>
            <p className="text-xs text-red-700">{error.message}</p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="border-red-300 bg-white text-red-700 hover:bg-red-50"
          onClick={retry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border mb-4">
      <PlayPauseButton 
        isPlaying={isPlaying} 
        onPlayPause={onPlayPause}
        disabled={!isAudioReady} 
      />

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
