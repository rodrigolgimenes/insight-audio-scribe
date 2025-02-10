
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PlayPauseButton } from "./audio/PlayPauseButton";
import { VolumeControl } from "./audio/VolumeControl";
import { PlaybackSpeedControl } from "./audio/PlaybackSpeedControl";
import { DownloadButton } from "./audio/DownloadButton";

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
  const { toast } = useToast();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (audioUrl) {
        try {
          console.log('Getting signed URL for:', audioUrl);
          
          // Generate a signed URL that expires in 1 hour
          const { data: { signedUrl }, error: signError } = await supabase
            .storage
            .from('audio_recordings')
            .createSignedUrl(audioUrl, 3600); // 1 hour in seconds

          if (signError || !signedUrl) {
            throw new Error('Failed to generate signed URL');
          }

          console.log('Generated signed URL');
          setSignedUrl(signedUrl);
          setIsAudioReady(true);
        } catch (error) {
          console.error('Error getting signed URL:', error);
          toast({
            title: "Error",
            description: "Failed to load audio file",
            variant: "destructive",
          });
        }
      }
    };

    getSignedUrl();
  }, [audioUrl, toast]);

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

      <audio
        ref={audioRef}
        src={signedUrl || undefined}
        onEnded={() => onPlayPause()}
        onError={(e) => {
          console.error('Audio error:', e);
          toast({
            title: "Error",
            description: "Error loading audio file",
            variant: "destructive",
          });
        }}
      />
    </div>
  );
};

