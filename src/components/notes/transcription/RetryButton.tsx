
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RetryButtonProps {
  onRetry: () => void;
  isDisabled?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({ 
  onRetry,
  isDisabled = false
}) => {
  return (
    <Button
      onClick={onRetry}
      variant="outline"
      className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 flex items-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 w-full justify-center mt-2 font-medium"
      disabled={isDisabled}
    >
      <RefreshCw className={`h-4 w-4 ${isDisabled ? 'animate-spin' : ''}`} />
      <span>{isDisabled ? 'Retrying...' : 'Retry Transcription'}</span>
    </Button>
  );
};
