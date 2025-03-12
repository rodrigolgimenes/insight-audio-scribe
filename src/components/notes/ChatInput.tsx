
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <ScrollArea className="max-h-[180px]">
            <Textarea
              id="chat-input"
              name="chat-input"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Type your question about the transcript..."
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg min-h-[60px] resize-none"
              rows={Math.min(input.split('\n').length || 1, 8)}
            />
          </ScrollArea>
        </div>
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
