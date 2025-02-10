
import { forwardRef } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AudioElementProps {
  src: string | undefined;
  onEnded: () => void;
}

export const AudioElement = forwardRef<HTMLAudioElement, AudioElementProps>(
  ({ src, onEnded }, ref) => {
    const { toast } = useToast();

    return (
      <audio
        ref={ref}
        src={src}
        onEnded={onEnded}
        onError={(e) => {
          console.error('Audio error:', e);
          toast({
            title: "Error",
            description: "Error loading audio file",
            variant: "destructive",
          });
        }}
      />
    );
  }
);

AudioElement.displayName = "AudioElement";
