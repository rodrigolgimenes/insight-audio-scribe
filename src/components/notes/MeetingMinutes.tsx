import { useState, useEffect } from "react";
import { AudioControlBar } from "./AudioControlBar";
import { useMeetingMinutes } from "./minutes/useMeetingMinutes";
import { MinutesContent } from "./minutes/MinutesContent";
import { RegenerateButton } from "./minutes/RegenerateButton";
import { LoadingSpinner } from "./minutes/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
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
    setDraftContent(minutes);
    setIsEditing(true);
  };

  const handleContentChange = (newContent: string) => {
    console.log('Content changed:', newContent);
    setDraftContent(newContent);
  };

  const handleSave = async () => {
    try {
      console.log('Saving draft content:', draftContent);
      if (draftContent !== null) {
        await updateMinutes(draftContent);
        toast({
          title: "Success",
          description: "Meeting minutes saved successfully",
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving minutes:', error);
      toast({
        title: "Error",
        description: "Failed to save meeting minutes",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraftContent(null);
  };

  const handleRegenerate = async () => {
    try {
      await generateMinutes({ isRegeneration: true });
    } catch (error) {
      console.error('Error regenerating minutes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate meeting minutes",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isEditing) {
      setDraftContent(null);
    }
  }, [isEditing]);

  useEffect(() => {
    const shouldGenerateMinutes = 
      !isLoadingInitialContent &&
      !isLoadingMinutes &&
      !minutes &&
      transcript &&
      !isGenerating;

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
              onRegenerate={handleRegenerate}
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
            onChange={isEditing ? handleContentChange : undefined}
            onSave={isEditing ? handleSave : undefined}
            onCancel={isEditing ? handleCancel : undefined}
            readOnly={!isEditing || isUpdating || isGenerating}
          />
        )}
      </div>
    </div>
  );
};
