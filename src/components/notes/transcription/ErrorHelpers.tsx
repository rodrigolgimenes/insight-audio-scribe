
import React from "react";
import { AlertCircle, Info } from "lucide-react";

interface ErrorHelpersProps {
  error?: string;
}

export const ErrorHelpers: React.FC<ErrorHelpersProps> = ({ error }) => {
  if (!error) return null;
  
  // Determine specific error type for more targeted help
  const isAudioFormatError = error.toLowerCase().includes('format') || 
                           error.toLowerCase().includes('formato');
  const isFileNotFoundError = error.toLowerCase().includes('not found') || 
                            error.toLowerCase().includes('não encontrado');
  const isFileSizeError = error.toLowerCase().includes('too large') || 
                        error.toLowerCase().includes('size limit') ||
                        error.toLowerCase().includes('muito grande');
  const isTimeoutError = error.toLowerCase().includes('timeout') || 
                      error.toLowerCase().includes('timed out');

  if (!isAudioFormatError && !isFileNotFoundError && !isFileSizeError && !isTimeoutError) {
    return <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-medium">{error}</p>
          
          {isFileNotFoundError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>The file may have been deleted or not uploaded correctly</li>
                <li>Try uploading a new file again</li>
                <li>Check if you have a stable internet connection</li>
              </ul>
            </div>
          )}
          
          {isAudioFormatError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Try converting the file to MP3 before uploading</li>
                <li>Check if the audio file is not corrupted</li>
                <li>Try using a different browser (Chrome, Firefox, or Edge)</li>
              </ul>
            </div>
          )}
          
          {isFileSizeError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Your file is too large (the limit is 25MB)</li>
                <li>Try splitting the recording into smaller parts</li>
                <li>Compress the file to reduce its size</li>
              </ul>
            </div>
          )}
          
          {isTimeoutError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Tips to resolve:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>The processing took too long and reached the limit</li>
                <li>Try with a shorter recording</li>
                <li>Check if you have a stable internet connection</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
