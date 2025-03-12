
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface RetryTranscriptionButtonProps {
  onRetry: () => Promise<void>;
}

export const RetryTranscriptionButton: React.FC<RetryTranscriptionButtonProps> = ({ onRetry }) => {
  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 text-[#9b87f5] border-[#9b87f5] hover:border-[#7E69AB] hover:bg-[#E5DEFF]"
      onClick={onRetry}
    >
      <RefreshCcw className="h-4 w-4" />
      Retry Transcription
    </Button>
  );
};
