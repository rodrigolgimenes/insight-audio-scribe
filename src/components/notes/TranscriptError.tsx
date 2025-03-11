
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { useState } from "react";

interface TranscriptErrorProps {
  error?: string;
  noteId?: string;
}

export const TranscriptError = ({ error, noteId }: TranscriptErrorProps) => {
  const { retryTranscription } = useNoteTranscription();
  const [isRetrying, setIsRetrying] = useState(false);

  const isFileNotFound = error?.toLowerCase().includes('not found') || 
                         error?.toLowerCase().includes('file not found');
  
  const isFileTooLarge = error?.toLowerCase().includes('maximum allowed size') ||
                         error?.toLowerCase().includes('too large') ||
                         error?.toLowerCase().includes('exceeds size limit');

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
        
        {isFileNotFound && (
          <div className="mt-3 text-sm">
            <div className="font-medium text-red-500 mb-1">Tips to resolve:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The file may have been deleted or not uploaded correctly</li>
              <li>Try uploading a new file again</li>
              <li>Check if you have a stable internet connection</li>
              <li>If your filename contains special characters, try renaming it with simple characters</li>
              <li>If you just uploaded this file, please wait a moment and try again</li>
            </ul>
          </div>
        )}
        
        {isFileTooLarge && (
          <div className="mt-3 text-sm">
            <div className="font-medium text-red-500 mb-1">Tips for large files:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>File size limit is 100MB</li>
              <li>Very long recordings (over 1 hour) may be too large to process</li>
              <li>Consider splitting your recording into smaller segments</li>
              <li>You can compress your audio files to reduce their size</li>
            </ul>
          </div>
        )}
        
        {noteId && (
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            variant="outline" 
            className="mt-3 bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Retry Transcription</span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
