
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatComponentProps {
  note: Note;
}

export const TranscriptChat = ({ note }: ChatComponentProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    
    console.log('TranscriptChat - Initial state:', {
      rawInput: input,
      trimmedInput: trimmedInput,
      transcript: note.original_transcript,
      transcriptType: typeof note.original_transcript,
      transcriptLength: note.original_transcript?.length,
      isLoading: isLoading,
      messagesCount: messages.length
    });
    
    if (!trimmedInput) {
      console.log('TranscriptChat - Validation failed: Empty input');
      toast({
        title: "Invalid input",
        description: "Please type a message before sending.",
        variant: "destructive",
      });
      return;
    }

    if (!note.original_transcript || typeof note.original_transcript !== 'string') {
      console.log('TranscriptChat - Validation failed: Invalid transcript', {
        transcript: note.original_transcript,
        type: typeof note.original_transcript
      });
      toast({
        title: "Transcription error",
        description: "The transcription is not available at the moment. Please try again.",
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
        transcriptPreview: note.original_transcript.substring(0, 100) + '...'
      });

      const { data, error } = await supabase.functions.invoke('chat-with-transcript', {
        body: { 
          messages: [...messages, userMessage],
          transcript: note.original_transcript
        },
      });

      console.log('TranscriptChat - Response received:', { data, error });

      if (error) {
        console.error('TranscriptChat - Supabase function error:', error);
        throw new Error(error.message || "Error processing message");
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
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('TranscriptChat - Error in chat process:', error);
      toast({
        title: "Error",
        description: "Could not process your message. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, there was an error processing your question. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else if (!isLoading) {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const stopGeneration = () => {
    setIsLoading(false);
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Chat with Transcript</h2>
      
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
