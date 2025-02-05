import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

interface MeetingMinutesProps {
  transcript: string | null;
  noteId: string;
}

export const MeetingMinutes = ({ transcript, noteId }: MeetingMinutesProps) => {
  const [minutes, setMinutes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMinutes = async (isRegeneration: boolean = false) => {
    if (!transcript) {
      setError("Não há transcrição disponível para gerar a ata.");
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
        throw new Error(functionError.message || "Erro ao gerar ata da reunião");
      }

      if (!data?.minutes) {
        throw new Error("Resposta inválida do servidor");
      }

      setMinutes(data.minutes);
      
      toast({
        title: "Sucesso",
        description: isRegeneration ? "Ata da reunião regenerada com sucesso" : "Ata da reunião gerada com sucesso",
      });
    } catch (err) {
      console.error('Error generating meeting minutes:', err);
      setError("Erro ao gerar a ata da reunião. Por favor, tente novamente.");
      toast({
        title: "Erro",
        description: "Falha ao gerar a ata da reunião",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchExistingMinutes = async () => {
      try {
        const { data, error } = await supabase
          .from('meeting_minutes')
          .select('content')
          .eq('note_id', noteId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching meeting minutes:', error);
          return;
        }

        if (data) {
          setMinutes(data.content);
        } else {
          // Se não existir ata, gera automaticamente
          await generateMinutes(false);
        }
      } catch (err) {
        console.error('Error fetching meeting minutes:', err);
      }
    };

    if (noteId) {
      fetchExistingMinutes();
    }
  }, [noteId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {minutes && (
          <Button
            onClick={() => generateMinutes(true)}
            disabled={isLoading || !transcript}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Regerar Ata de Reunião
          </Button>
        )}
      </div>

      {isLoading && !minutes && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Gerando Ata...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {minutes && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
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
          </div>
        </div>
      )}
    </div>
  );
};