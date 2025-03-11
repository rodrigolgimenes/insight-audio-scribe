
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface RetryButtonProps {
  onRetry: () => Promise<void>;
}

export const RetryButton: React.FC<RetryButtonProps> = ({ onRetry }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      className="mt-3 bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 w-full sm:w-auto"
      onClick={handleRetry}
      size="sm"
      disabled={isRetrying}
    >
      <RefreshCcw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} /> 
      {isRetrying ? 'Retrying...' : 'Try again'}
    </Button>
  );
};
