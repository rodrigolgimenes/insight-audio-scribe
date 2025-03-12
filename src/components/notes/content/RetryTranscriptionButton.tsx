
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
      className="w-full flex items-center justify-center gap-2 text-palatinate-blue border-palatinate-blue hover:border-primary-dark hover:bg-lavender-web"
      onClick={onRetry}
    >
      <RefreshCcw className="h-4 w-4" />
      Retry Transcription
    </Button>
  );
};
