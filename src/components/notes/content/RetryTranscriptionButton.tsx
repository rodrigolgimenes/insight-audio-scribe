
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
      className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
      onClick={onRetry}
    >
      <RefreshCcw className="h-4 w-4" />
      Retry Transcription
    </Button>
  );
};
