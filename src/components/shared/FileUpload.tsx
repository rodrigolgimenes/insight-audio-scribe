
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileUpload } from "@/hooks/upload/useFileUpload";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { validateFile, showValidationError } from "@/utils/upload/fileValidation";

interface FileUploadProps {
  onUploadComplete?: (noteId: string) => void;
  label?: string;
  description?: string;
  buttonText?: string;
  accept?: string;
  initiateTranscription?: boolean;
  disabled?: boolean;
  buttonClassName?: string;
  hideDescription?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  label = "Upload Audio",
  description = "Upload your audio file",
  buttonText = "Upload File",
  accept = "audio/*,video/mp4",
  initiateTranscription = true,
  disabled = false,
  buttonClassName = "",
  hideDescription = false,
}) => {
  const { isUploading, handleFileUpload } = useFileUpload();
  const [processingState, setProcessingState] = useState<'idle' | 'validating' | 'uploading'>('idle');
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setProcessingError(null);
    setProcessingProgress(0);
    setSelectedFileName(file.name);
    
    // Validação do arquivo
    setProcessingState('validating');
    const validation = validateFile(file);
    if (!validation.isValid) {
      showValidationError(validation.errorMessage || "Invalid file");
      setProcessingError(validation.errorMessage || "Invalid file format");
      setProcessingState('idle');
      return;
    }
    
    // Show appropriate message based on file type
    if (file.type.startsWith('video/')) {
      toast({
        title: "Processing Video",
        description: "Your video will be uploaded and processed by our server. This may take a moment...",
      });
    } else if (file.type.startsWith('audio/')) {
      toast({
        title: "Processing Audio",
        description: "Your audio will be uploaded and processed. This may take a moment...",
      });
    } else {
      toast({
        title: "Processing File",
        description: "Attempting to process file. This may take a moment...",
      });
    }

    try {
      setProcessingState('uploading');
      setProcessingProgress(20);
      
      // Upload the original file directly to the server
      const noteId = await handleFileUpload(e, initiateTranscription, file);
      setProcessingState('idle');
      setProcessingProgress(100);
      
      if (noteId) {
        toast({
          title: "Upload Complete",
          description: "Your file has been uploaded and is being processed on our servers.",
        });
        
        if (onUploadComplete) {
          onUploadComplete(noteId);
        } else {
          navigate(`/app/notes/${noteId}`);
        }
      }
    } catch (error) {
      setProcessingState('idle');
      setProcessingProgress(0);
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const getButtonText = () => {
    if (processingState === 'validating') {
      return "Validating file...";
    } else if (processingState === 'uploading' || isUploading) {
      return "Uploading...";
    }
    return buttonText;
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      {!hideDescription && description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <Input
        ref={inputRef}
        id="file-upload"
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading || processingState !== 'idle'}
      />
      <Button
        onClick={handleClick}
        disabled={disabled || isUploading || processingState !== 'idle'}
        className={buttonClassName}
      >
        {(isUploading || processingState !== 'idle') && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {getButtonText()}
      </Button>
      
      {selectedFileName && processingState !== 'idle' && (
        <div className="mt-2 text-xs text-muted-foreground">
          File: {selectedFileName}
        </div>
      )}
      
      {processingState !== 'idle' && processingProgress > 0 && (
        <div className="w-full mt-2">
          <div className="bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {processingState === 'validating' && 'Validating file...'}
            {processingState === 'uploading' && 'Uploading...'}
          </p>
        </div>
      )}
      
      {processingError && (
        <div className="mt-2 text-sm text-yellow-600 flex items-start">
          <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{processingError}</span>
        </div>
      )}
    </div>
  );
};
