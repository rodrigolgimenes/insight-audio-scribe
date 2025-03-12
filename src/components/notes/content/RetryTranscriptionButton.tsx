
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RetryTranscriptionButtonProps {
  onRetry: () => Promise<void>;
}

export const RetryTranscriptionButton: React.FC<RetryTranscriptionButtonProps> = ({ onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await onRetry();
      toast.success("Transcription restarted successfully");
    } catch (error) {
      console.error("Error retrying transcription:", error);
      toast.error("Failed to retry transcription");
    } finally {
      setIsRetrying(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 text-palatinate-blue border-palatinate-blue hover:border-palatinate-blue hover:bg-lavender-web"
      onClick={handleRetry}
      disabled={isRetrying}
    >
      {isRetrying ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}
      {isRetrying ? "Retrying..." : "Retry Transcription"}
    </Button>
  );
};
