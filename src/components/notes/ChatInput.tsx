import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const ChatInput = ({
  input,
  isLoading,
  onInputChange,
  onSendMessage,
  onStopGeneration,
  onKeyPress
}: ChatInputProps) => {
  return (
    <div className="border-t p-4 bg-white">
      <div className="flex gap-2 items-center">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Digite sua pergunta sobre a transcrição..."
          disabled={isLoading}
          className="flex-1 py-3 px-4 rounded-lg"
          type="text"
        />
        <div className="flex gap-2">
          {isLoading ? (
            <Button 
              onClick={onStopGeneration}
              variant="outline"
              size="icon"
              className="shrink-0"
              type="button"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : null}
          <Button 
            onClick={onSendMessage} 
            disabled={isLoading || !input.trim()}
            className="shrink-0"
            type="button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};