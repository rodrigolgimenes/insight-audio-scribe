
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { AudioControlBar } from "./AudioControlBar";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meeting minutes with improved caching
  const { data: minutes, isLoading: isLoadingMinutes } = useQuery({
    queryKey: ['meeting-minutes', noteId],
    queryFn: async () => {
      console.log('Fetching meeting minutes for note:', noteId);
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select('content')
        .eq('note_id', noteId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching meeting minutes:', error);
        throw error;
      }

      console.log('Meeting minutes data:', data);
      return data?.content || null;
    },
    initialData: initialContent || undefined,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Mutation for generating/regenerating minutes
  const { mutate: generateMinutes, isLoading: isGenerating } = useMutation({
    mutationFn: async ({ isRegeneration = false }: { isRegeneration: boolean }) => {
      if (!transcript) {
        throw new Error("No transcript available to generate minutes.");
      }

      console.log('Generating minutes with params:', {
        hasTranscript: !!transcript,
        transcriptLength: transcript.length,
        noteId,
        isRegeneration
      });

      const { data, error: functionError } = await supabase.functions.invoke('generate-meeting-minutes', {
        body: { 
          transcript,
          noteId,
          isRegeneration
        },
      });

      if (functionError || !data?.minutes) {
        console.error('Error from edge function:', functionError);
        throw new Error(functionError?.message || "Failed to generate meeting minutes");
      }

      return data.minutes;
    },
    onSuccess: (newMinutes) => {
      // Invalidate and update cache immediately
      queryClient.setQueryData(['meeting-minutes', noteId], newMinutes);
      
      toast({
        title: "Success",
        description: "Meeting minutes generated successfully",
      });
    },
    onError: (error) => {
      console.error('Error generating meeting minutes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate meeting minutes",
        variant: "destructive",
      });
    }
  });

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-generate minutes only if needed
  useEffect(() => {
    const shouldGenerateMinutes = 
      !isLoadingInitialContent && // Não está carregando o conteúdo inicial
      !isLoadingMinutes && // Não está carregando minutos do cache
      !minutes && // Não tem minutos no cache
      transcript && // Tem transcrição disponível
      !isGenerating; // Não está gerando minutos no momento

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
              onClick={() => generateMinutes({ isRegeneration: true })}
              disabled={isGenerating || !transcript}
              className="gap-2"
              variant="outline"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              Regenerate Meeting Minutes
            </Button>
          </div>
        )}

        {isGenerating && !minutes && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Generating Minutes...</span>
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
