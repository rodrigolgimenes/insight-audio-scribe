import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";

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

    const userMessage: Message = { role: 'user', content: trimmedInput };
    console.log('TranscriptChat - Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
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
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSendMessage={handleSendMessage}
          onStopGeneration={stopGeneration}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
};