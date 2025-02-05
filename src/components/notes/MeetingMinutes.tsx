import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MeetingMinutesProps {
  transcript: string | null;
}

export const MeetingMinutes = ({ transcript }: MeetingMinutesProps) => {
  const [minutes, setMinutes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMinutes = async () => {
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
          transcript: transcript
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
        description: "Ata da reunião gerada com sucesso",
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          onClick={generateMinutes}
          disabled={isLoading || !transcript}
          className="gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar Ata de Reunião
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {minutes && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: minutes }} />
        </div>
      )}
    </div>
  );
};