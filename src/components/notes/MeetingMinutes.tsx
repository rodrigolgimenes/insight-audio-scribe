
import { useState, useEffect } from "react";
import { AudioControlBar } from "./AudioControlBar";
import { useMeetingMinutes } from "./minutes/useMeetingMinutes";
import { MinutesContent } from "./minutes/MinutesContent";
import { RegenerateButton } from "./minutes/RegenerateButton";
import { LoadingSpinner } from "./minutes/LoadingSpinner";

interface MeetingMinutesProps {
  transcript: string | null;
  noteId: string;
  audioUrl?: string | null;
  initialContent?: string | null;
  isLoadingInitialContent?: boolean;
}

export const MeetingMinutes = ({ 
  transcript, 
  noteId, 
  audioUrl, 
  initialContent,
  isLoadingInitialContent 
}: MeetingMinutesProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const {
    minutes,
    isLoadingMinutes,
    generateMinutes,
    isGenerating
  } = useMeetingMinutes(noteId, initialContent);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-generate minutes only if needed
  useEffect(() => {
    const shouldGenerateMinutes = 
      !isLoadingInitialContent &&
      !isLoadingMinutes &&
      !minutes &&
      transcript &&
      !isGenerating;

    console.log('Checking auto-generation conditions:', {
      isLoadingInitialContent,
      isLoadingMinutes,
      hasMinutes: !!minutes,
      hasTranscript: !!transcript,
      isGenerating,
      shouldGenerate: shouldGenerateMinutes
    });

    if (shouldGenerateMinutes) {
      console.log('Auto-generating new minutes');
      generateMinutes({ isRegeneration: false });
    }
  }, [
    isLoadingInitialContent,
    isLoadingMinutes,
    minutes,
    transcript,
    isGenerating,
    generateMinutes
  ]);

  if (isLoadingInitialContent || isLoadingMinutes) {
    return <LoadingSpinner message="Loading meeting minutes..." />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        {audioUrl && (
          <div className="mb-6">
            <AudioControlBar
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
            />
          </div>
        )}

        {minutes && (
          <div className="mb-6">
            <RegenerateButton
              onRegenerate={() => generateMinutes({ isRegeneration: true })}
              isGenerating={isGenerating}
              disabled={!transcript}
            />
          </div>
        )}

        {isGenerating && !minutes && (
          <LoadingSpinner message="Generating Minutes..." />
        )}

        {minutes && <MinutesContent content={minutes} />}
      </div>
    </div>
  );
};
