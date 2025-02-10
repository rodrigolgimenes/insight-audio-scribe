
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const getPublicUrl = async () => {
      if (audioUrl) {
        try {
          console.log('Processing audio URL:', audioUrl);
          
          // Remove any file extension from the base path
          const basePath = audioUrl.replace(/\.(webm|mp3)$/, '');
          
          // Try both .webm and .mp3 extensions
          const extensions = ['.webm', '.mp3'];
          
          for (const ext of extensions) {
            const testPath = `${basePath}${ext}`;
            console.log('Testing path:', testPath);
            
            const { data: { publicUrl } } = supabase.storage
              .from('audio_recordings')
              .getPublicUrl(testPath);

            // Create a temporary Audio element to test if the URL is valid
            const tempAudio = new Audio();
            tempAudio.src = publicUrl;
            
            try {
              await new Promise((resolve, reject) => {
                tempAudio.addEventListener('loadedmetadata', resolve);
                tempAudio.addEventListener('error', reject);
                setTimeout(reject, 2000); // Timeout after 2 seconds
              });
              
              console.log('Found valid audio file:', publicUrl);
              setPublicUrl(publicUrl);
              return; // Exit once we find a valid URL
            } catch (error) {
              console.log(`File with ${ext} not found or not playable`);
              continue;
            }
          }
          
          // If we get here, no valid audio file was found
          toast({
            title: "Error",
            description: "Could not load audio file",
            variant: "destructive",
          });
        } catch (error) {
          console.error('Error getting audio URL:', error);
          toast({
            title: "Error",
            description: "Failed to load audio file",
            variant: "destructive",
          });
        }
      }
    };

    getPublicUrl();
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
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume, isMuted, playbackRate]);

  const handleDownload = async () => {
    if (!publicUrl) return;
    
    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording${publicUrl.endsWith('.mp3') ? '.mp3' : '.webm'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download audio file",
        variant: "destructive",
      });
    }
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border mb-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPlayPause}
        className="text-primary hover:bg-primary/10"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      <div className="flex items-center gap-2 w-32">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="text-primary hover:bg-primary/10"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          onValueChange={(newVolume) => {
            setVolume(newVolume[0]);
            setIsMuted(false);
          }}
          max={1}
          step={0.1}
          className="w-20"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPlaybackRate(prev => Math.min(2, prev + 0.5))}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{playbackRate}x</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPlaybackRate(prev => Math.max(0.5, prev - 0.5))}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleDownload}
        disabled={!publicUrl}
        className="text-primary hover:bg-primary/10"
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>

      <audio
        ref={audioRef}
        src={publicUrl || undefined}
        onEnded={() => onPlayPause()}
      />
    </div>
  );
};
