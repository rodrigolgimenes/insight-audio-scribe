
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/upload/useFileUpload';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (noteId: string, recordingId: string) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSizeMB?: number;
  initiateTranscription?: boolean;
  label?: string;
  description?: string;
  buttonText?: string;
  buttonClassName?: string;
  hideDescription?: boolean;
  disabled?: boolean;
  onConversionUpdate?: (
    status: 'idle' | 'converting' | 'success' | 'error',
    progress: number,
    originalFile: File | null,
    convertedFile: File | null
  ) => void;
  skipDeviceCheck?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onError,
  accept = 'audio/*',
  maxSizeMB = 100,
  initiateTranscription = true,
  label = 'Upload File',
  description = 'Click or drag and drop a file',
  buttonText = 'Upload',
  buttonClassName = '',
  hideDescription = false,
  disabled = false,
  onConversionUpdate,
  skipDeviceCheck = false
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, handleFileUpload } = useFileUpload();

  const handleClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > maxSizeMB) {
        toast.error(`File too large (${Math.round(fileSizeMB)}MB). Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      const result = await handleFileUpload(e, initiateTranscription);
      
      if (result && onUploadComplete) {
        onUploadComplete(result.noteId, result.recordingId);
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <div className="flex flex-col items-center">
        <Button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className={`${buttonClassName} ${isUploading ? 'opacity-70' : ''}`}
          variant="default"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> {buttonText}
            </>
          )}
        </Button>
        
        {!hideDescription && (
          <p className="mt-2 text-sm text-gray-500">
            {description}
          </p>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="sr-only"
          disabled={disabled || isUploading}
        />
      </div>
    </div>
  );
}
