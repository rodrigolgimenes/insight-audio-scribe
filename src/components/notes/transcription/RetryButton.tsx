
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface RetryButtonProps {
  onRetry: () => Promise<void>;
}

export const RetryButton: React.FC<RetryButtonProps> = ({ onRetry }) => {
  return (
    <Button
      variant="outline"
      className="mt-3 bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
      onClick={onRetry}
      size="sm"
    >
      <RefreshCcw className="h-4 w-4 mr-2" /> Try again
    </Button>
  );
};
