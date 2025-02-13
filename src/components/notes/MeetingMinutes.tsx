
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { AudioControlBar } from "./AudioControlBar";
import { useQueryClient } from "@tanstack/react-query";

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
  const [minutes, setMinutes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Atualiza o estado local quando o conteúdo inicial muda
  useEffect(() => {
    if (initialContent !== undefined) {
      setMinutes(initialContent);
    }
  }, [initialContent]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const generateMinutes = async (isRegeneration: boolean = false) => {
    if (!transcript) {
      setError("No transcript available to generate minutes.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending transcript to OpenAI...', transcript.substring(0, 100) + '...');
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-meeting-minutes', {
        body: { 
          transcript: transcript,
          noteId: noteId,
          isRegeneration: isRegeneration
        },
      });

      console.log('Response from generate-meeting-minutes:', { data, functionError });

      if (functionError) {
        console.error('Error from edge function:', functionError);
        throw new Error(functionError.message || "Error generating meeting minutes");
      }

      if (!data?.minutes) {
        throw new Error("Invalid response from server");
      }

      // Update local state
      setMinutes(data.minutes);
      
      // Update database directly to ensure persistence
      const { error: updateError } = await supabase
        .from('meeting_minutes')
        .upsert({
          note_id: noteId,
          content: data.minutes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error saving meeting minutes:', updateError);
        throw new Error("Failed to save meeting minutes");
      }

      // Invalidate and refetch the meeting minutes query
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', noteId] });
      
      toast({
        title: "Success",
        description: isRegeneration ? "Meeting minutes regenerated successfully" : "Meeting minutes generated successfully",
      });
    } catch (err) {
      console.error('Error generating meeting minutes:', err);
      setError("Failed to generate meeting minutes. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate meeting minutes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Só gera as atas se não houver conteúdo inicial e não estiver carregando
  useEffect(() => {
    const shouldGenerateMinutes = !isLoadingInitialContent && 
                                 !minutes && 
                                 !initialContent && 
                                 transcript && 
                                 !isLoading;

    if (shouldGenerateMinutes) {
      console.log('Generating minutes because:', {
        isLoadingInitialContent,
        minutes,
        initialContent,
        hasTranscript: !!transcript,
        isLoading
      });
      generateMinutes(false);
    }
  }, [isLoadingInitialContent, minutes, initialContent, transcript, isLoading]);

  if (isLoadingInitialContent) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading meeting minutes...</span>
      </div>
    );
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
            <Button
              onClick={() => generateMinutes(true)}
              disabled={isLoading || !transcript}
              className="gap-2"
              variant="outline"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Regenerate Meeting Minutes
            </Button>
          </div>
        )}

        {isLoading && !minutes && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Generating Minutes...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {minutes && (
          <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-800 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium text-gray-700 mb-2">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 text-gray-600">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 text-gray-600">{children}</ol>,
                p: ({ children }) => <p className="text-gray-600 mb-4 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="text-gray-700 italic">{children}</em>,
              }}
            >
              {minutes}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
