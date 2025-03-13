
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, FileSymlink, HelpCircle } from "lucide-react";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { useState } from "react";

interface TranscriptErrorProps {
  error?: string;
  noteId?: string;
}

export const TranscriptError = ({ error, noteId }: TranscriptErrorProps) => {
  const { retryTranscription } = useNoteTranscription();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isEdgeFunctionError = error?.toLowerCase().includes('edge function') ||
                            error?.toLowerCase().includes('status code') ||
                            error?.toLowerCase().includes('non-2xx');
                            
  const isServiceUnavailable = error?.toLowerCase().includes('503') ||
                             error?.toLowerCase().includes('service unavailable') ||
                             error?.toLowerCase().includes('unavailable');

  const handleRetry = async () => {
    if (!noteId) return;
    
    setIsRetrying(true);
    try {
      await retryTranscription(noteId);
    } catch (err) {
      console.error("Error retrying transcription:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="ml-2">Processing error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-red-600 font-medium mb-2">
          {isEdgeFunctionError || isServiceUnavailable 
            ? "Transcription service is temporarily unavailable" 
            : error}
        </div>
        
        <div className="flex items-center gap-2 mt-2 mb-3">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            {showDetails ? 'Hide tips' : 'Show tips to resolve'}
          </Button>
        </div>
        
        {showDetails && (
          <div className="mt-2 mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-md">
            {(isEdgeFunctionError || isServiceUnavailable) && (
              <div className="mt-1 text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>The transcription service is temporarily unavailable</li>
                  <li>This is a server-side issue that will resolve automatically</li>
                  <li>Wait a few minutes and try the 'Retry' button</li>
                  <li>If the problem persists after several attempts, contact support</li>
                  <li>You can try again later when the service is less busy</li>
                </ul>
              </div>
            )}
            
            {!isEdgeFunctionError && !isServiceUnavailable && (
              <div className="mt-1 text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Try refreshing the page</li>
                  <li>Check your internet connection</li>
                  <li>The file may be in an unsupported format</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            variant="outline" 
            className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry Transcription'}</span>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex items-center gap-2"
            onClick={() => window.location.href = "/app"}
          >
            <FileSymlink className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
