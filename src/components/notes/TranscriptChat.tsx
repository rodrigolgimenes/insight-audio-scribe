import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TranscriptChatProps {
  transcript: string | null;
}

export const TranscriptChat = ({ transcript }: TranscriptChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    
    console.log('TranscriptChat - Initial state:', {
      rawInput: input,
      trimmedInput: trimmedInput,
      transcript: transcript,
      transcriptType: typeof transcript,
      transcriptLength: transcript?.length,
      isLoading: isLoading,
      messagesCount: messages.length
    });
    
    if (!trimmedInput) {
      console.log('TranscriptChat - Validation failed: Empty input');
      toast({
        title: "Entrada inválida",
        description: "Por favor, digite uma mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    if (!transcript || typeof transcript !== 'string') {
      console.log('TranscriptChat - Validation failed: Invalid transcript', {
        transcript: transcript,
        type: typeof transcript
      });
      toast({
        title: "Erro na transcrição",
        description: "A transcrição não está disponível no momento. Por favor, tente novamente.",
        variant: "destructive",
      });
      return;
    }

    // Adiciona mensagem do usuário imediatamente
    const userMessage: Message = { role: 'user', content: trimmedInput };
    console.log('TranscriptChat - Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    
    // Limpa input imediatamente após envio
    setInput('');
    setIsLoading(true);

    try {
      console.log('TranscriptChat - Sending request to chat-with-transcript:', {
        messagesCount: messages.length + 1,
        transcriptPreview: transcript.substring(0, 100) + '...'
      });

      const { data, error } = await supabase.functions.invoke('chat-with-transcript', {
        body: { 
          messages: [...messages, userMessage],
          transcript
        },
      });

      console.log('TranscriptChat - Response received:', { data, error });

      if (error) {
        console.error('TranscriptChat - Supabase function error:', error);
        throw new Error(error.message || "Erro ao processar mensagem");
      }

      if (data?.message) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.message 
        };
        console.log('TranscriptChat - Adding assistant response:', assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.error('TranscriptChat - Invalid response:', data);
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      console.error('TranscriptChat - Error in chat process:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        role: 'assistant',
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const stopGeneration = () => {
    setIsLoading(false);
  };

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Chat com a Transcrição</h2>
      
      <div className="border rounded-lg shadow-lg bg-white overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-white">
          <div className="flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre a transcrição..."
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg"
              type="text"
            />
            <div className="flex gap-2">
              {isLoading ? (
                <Button 
                  onClick={stopGeneration}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  type="button"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : null}
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className="shrink-0"
                type="button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
