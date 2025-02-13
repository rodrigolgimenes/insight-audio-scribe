
import { useState, useEffect } from "react";
import { AudioControlBar } from "./AudioControlBar";
import { useMeetingMinutes } from "./minutes/useMeetingMinutes";
import { MinutesContent } from "./minutes/MinutesContent";
import { RegenerateButton } from "./minutes/RegenerateButton";
import { LoadingSpinner } from "./minutes/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

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
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  
  const {
    minutes,
    isLoadingMinutes,
    generateMinutes,
    isGenerating,
    updateMinutes,
    isUpdating
  } = useMeetingMinutes(noteId, initialContent);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStartEditing = () => {
    setDraftContent(minutes || '');
    setIsEditing(true);
  };

  const handleContentChange = (newContent: string) => {
    setDraftContent(newContent);
  };

  const handleSave = () => {
    if (draftContent !== null) {
      updateMinutes(draftContent);
      setIsEditing(false);
      setDraftContent(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraftContent(null);
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

        <div className="mb-6 flex gap-2">
          {minutes && !isEditing && (
            <Button
              onClick={handleStartEditing}
              variant="outline"
              className="gap-2"
              disabled={isGenerating}
            >
              <Edit2 className="h-4 w-4" />
              Edit Meeting Minutes
            </Button>
          )}
          
          {minutes && (
            <RegenerateButton
              onRegenerate={() => generateMinutes({ isRegeneration: true })}
              isGenerating={isGenerating}
              disabled={!transcript || isEditing}
            />
          )}
        </div>

        {isGenerating && !minutes && (
          <LoadingSpinner message="Generating Minutes..." />
        )}

        {minutes && (
          <MinutesContent 
            content={isEditing ? (draftContent || minutes) : minutes}
            onChange={handleContentChange}
            onSave={isEditing ? handleSave : undefined}
            onCancel={isEditing ? handleCancel : undefined}
            readOnly={!isEditing || isUpdating || isGenerating}
          />
        )}
      </div>
    </div>
  );
};
