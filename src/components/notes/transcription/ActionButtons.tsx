
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle } from "lucide-react";

interface ActionButtonsProps {
  showRetryButton: boolean;
  hasInconsistentState: boolean;
  onRetry: () => Promise<void>;
  onSyncStatus: () => Promise<void>;
  isRetrying: boolean;
  isSyncing: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  showRetryButton,
  hasInconsistentState,
  onRetry,
  onSyncStatus,
  isRetrying,
  isSyncing
}) => {
  if (!showRetryButton && !hasInconsistentState) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {showRetryButton && (
        <Button
          variant="outline"
          className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 flex justify-center items-center gap-2"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry Transcription'}</span>
        </Button>
      )}
      
      {hasInconsistentState && (
        <Button
          variant="outline"
          className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex justify-center items-center gap-2"
          onClick={onSyncStatus}
          disabled={isSyncing}
        >
          <CheckCircle className="h-4 w-4" />
          <span>{isSyncing ? 'Syncing...' : 'Sync Status'}</span>
        </Button>
      )}
    </div>
  );
};
