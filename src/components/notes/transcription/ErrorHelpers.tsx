
import React from "react";
import { AlertCircle, Info } from "lucide-react";

interface ErrorHelpersProps {
  error?: string;
}

export const ErrorHelpers: React.FC<ErrorHelpersProps> = ({ error }) => {
  if (!error) return null;
  
  // Determine specific error type for more targeted help
  const isAudioFormatError = error.toLowerCase().includes('format');
  const isFileNotFoundError = error.toLowerCase().includes('not found') || 
                            error.toLowerCase().includes('file not found');
  const isFileSizeError = error.toLowerCase().includes('too large') || 
                        error.toLowerCase().includes('size limit');
  const isTimeoutError = error.toLowerCase().includes('timeout') || 
                      error.toLowerCase().includes('timed out');
  const isDurationError = error.toLowerCase().includes('duration');
  const isEdgeFunctionError = error.toLowerCase().includes('edge function') || 
                            error.toLowerCase().includes('status code');

  // Clean up encoded file paths for better display
  let displayError = error;
  if (isFileNotFoundError && error.includes('%')) {
    try {
      displayError = error.replace(/([^:]+)%[^:]+/g, (match) => {
        const parts = match.split(':');
        if (parts.length > 1) {
          return `${parts[0]}: [encoded filename]`;
        }
        return match;
      });
    } catch (e) {
      // Keep original error if decoding fails
      console.error('Error cleaning up file path:', e);
    }
  }

  if (!isAudioFormatError && !isFileNotFoundError && !isFileSizeError && !isTimeoutError && !isDurationError && !isEdgeFunctionError) {
    return <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{displayError}</div>;
  }

  return (
    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-medium">{displayError}</p>
          
          {isFileNotFoundError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>The file may have been deleted or not uploaded correctly</li>
                <li>Try uploading a new file again</li>
                <li>Check if you have a stable internet connection</li>
                <li>If your filename contains special characters, try renaming it with simple characters</li>
                <li>If you just uploaded this file, please wait a moment and try again</li>
              </ul>
            </div>
          )}
          
          {isAudioFormatError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Try converting the file to MP3 before uploading</li>
                <li>Check if the audio file is not corrupted</li>
                <li>Try using a different browser (Chrome, Firefox or Edge)</li>
              </ul>
            </div>
          )}
          
          {isFileSizeError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Your file is too large (the limit is 25MB)</li>
                <li>Try dividing the recording into smaller parts</li>
                <li>Compress the file to reduce its size</li>
              </ul>
            </div>
          )}
          
          {isTimeoutError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>The processing took too long and reached the timeout limit</li>
                <li>For longer recordings (over 30 minutes), the process may take longer</li>
                <li>Check if you have a stable internet connection</li>
                <li>Try again at a different time when servers might be less busy</li>
              </ul>
            </div>
          )}
          
          {isDurationError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>The recording exceeds the maximum supported duration (60 minutes)</li>
                <li>Divide your recordings into shorter sessions for better results</li>
                <li>Shorter recordings also tend to generate more accurate transcriptions</li>
              </ul>
            </div>
          )}
          
          {isEdgeFunctionError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>There was a problem with the processing server</li>
                <li>This is usually a temporary issue</li>
                <li>Try the 'Retry' button if available</li>
                <li>If the problem persists, try uploading a different file format</li>
                <li>Check if your internet connection is stable</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
