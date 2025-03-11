
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

  const isFileNotFound = error?.toLowerCase().includes('not found') || 
                         error?.toLowerCase().includes('file not found');
  
  const isFileTooLarge = error?.toLowerCase().includes('maximum allowed size') ||
                         error?.toLowerCase().includes('too large') ||
                         error?.toLowerCase().includes('exceeds size limit');
                         
  const isPermissionError = error?.toLowerCase().includes('permission') ||
                          error?.toLowerCase().includes('access denied') ||
                          error?.toLowerCase().includes('not authorized');
                          
  const isNetworkError = error?.toLowerCase().includes('network') ||
                        error?.toLowerCase().includes('connection') ||
                        error?.toLowerCase().includes('timeout');
                        
  const isProcessingError = error?.toLowerCase().includes('processing') ||
                          error?.toLowerCase().includes('transcription failed');

  const isEdgeFunctionError = error?.toLowerCase().includes('edge function') ||
                            error?.toLowerCase().includes('status code');

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
        <div className="text-red-600 font-medium mb-2">{error}</div>
        
        <div className="flex items-center gap-2 mt-2 mb-3">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            {showDetails ? 'Hide details' : 'Show troubleshooting tips'}
          </Button>
        </div>
        
        {showDetails && (
          <div className="mt-2 mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-md">
            {isEdgeFunctionError && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">Edge Function issues:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>There was a problem with the processing server</li>
                  <li>This is usually a temporary issue</li>
                  <li>Try the 'Retry Transcription' button below</li>
                  <li>If the problem persists, try uploading a different file format</li>
                  <li>Some file formats may not be supported by the transcription service</li>
                </ul>
              </div>
            )}
            
            {isFileNotFound && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">File not found issues:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The file may have been deleted or not uploaded correctly</li>
                  <li>The storage bucket permissions may be incorrect</li>
                  <li>Try uploading the file again</li>
                  <li>Check if your filename contains special characters, try renaming it</li>
                  <li>If you just uploaded this file, please wait a moment and try again</li>
                </ul>
              </div>
            )}
            
            {isFileTooLarge && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">File size issues:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>File size limit is 100MB</li>
                  <li>Very long recordings (over 1 hour) may be too large to process</li>
                  <li>Consider splitting your recording into smaller segments</li>
                  <li>You can compress your audio files to reduce their size</li>
                </ul>
              </div>
            )}
            
            {isPermissionError && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">Permission issues:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You may not have permission to access this file</li>
                  <li>Try logging out and logging back in</li>
                  <li>The file may be owned by another user</li>
                </ul>
              </div>
            )}
            
            {isNetworkError && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">Network issues:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check your internet connection</li>
                  <li>The server might be temporarily unavailable</li>
                  <li>Try again after a few minutes</li>
                </ul>
              </div>
            )}
            
            {isProcessingError && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">Processing issues:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The audio format might not be supported</li>
                  <li>The file might be corrupted</li>
                  <li>Try converting your audio to a different format (MP3 is recommended)</li>
                  <li>Very long or complex audio can sometimes cause processing issues</li>
                </ul>
              </div>
            )}
            
            {/* Generic troubleshooting tips if no specific error type is matched */}
            {!isFileNotFound && !isFileTooLarge && !isPermissionError && !isNetworkError && !isProcessingError && !isEdgeFunctionError && (
              <div className="mt-1 text-sm">
                <div className="font-medium text-red-500 mb-1">General troubleshooting:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Try uploading the file again</li>
                  <li>Check the audio file format (MP3 is recommended)</li>
                  <li>Ensure the file isn't corrupted</li>
                  <li>Try a different browser or device</li>
                  <li>Clear your browser cache and cookies</li>
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
