
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileUpload } from "@/hooks/upload/useFileUpload";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { audioProcessor } from "@/utils/audio/processing/AudioProcessor";

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
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'uploading'>('idle');
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setProcessingError(null);
    
    // Show appropriate message based on file type
    if (file.type.startsWith('video/')) {
      setProcessingState('processing');
      toast({
        title: "Processing Video",
        description: "Extracting audio from video file. This may take a moment...",
      });
    } else if (file.type.startsWith('audio/') && file.type !== 'audio/mp3' && file.type !== 'audio/mpeg') {
      setProcessingState('processing');
      toast({
        title: "Processing Audio",
        description: "Converting audio to optimal format. This may take a moment...",
      });
    } else {
      setProcessingState('uploading');
    }

    try {
      let processedFile = file;
      
      // Process video/audio files if needed
      if (audioProcessor.needsProcessing(file)) {
        console.log("File needs processing before upload:", file.type);
        try {
          processedFile = await audioProcessor.processFile(file);
          console.log("File processed successfully:", 
            processedFile.type, processedFile.size, "bytes");
            
          // Verify the processed file actually has MP3 mime type
          if (!processedFile.type.includes("mp3") && !processedFile.type.includes("mpeg")) {
            console.warn("Processed file doesn't have MP3 mime type:", processedFile.type);
            // Force the correct MIME type
            const arrayBuffer = await processedFile.arrayBuffer();
            processedFile = new File(
              [arrayBuffer], 
              processedFile.name, 
              { type: 'audio/mp3' }
            );
            console.log("File MIME type forced to audio/mp3");
          }
          
          // Verify file has content
          if (processedFile.size === 0) {
            throw new Error("Processed file is empty (0 bytes)");
          }
          
          console.log("Proceeding with processed file:", 
            processedFile.name, processedFile.type, processedFile.size);
        } catch (processingError) {
          console.error("Error processing file:", processingError);
          setProcessingError("Could not process file for optimal audio. Using original file instead.");
          
          toast({
            title: "Processing Warning",
            description: "Could not process file for optimal audio. Using original file instead.",
            // Fix the invalid variant "warning" to use "destructive" instead
            variant: "destructive",
          });
          
          // Force mime type on original file if it's being used as fallback
          const arrayBuffer = await file.arrayBuffer();
          processedFile = new File(
            [arrayBuffer], 
            file.name.replace(/\.[^/.]+$/, '') + '.mp3', 
            { type: 'audio/mp3' }
          );
        }
      }

      setProcessingState('uploading');
      
      const noteId = await handleFileUpload(e, initiateTranscription, processedFile);
      setProcessingState('idle');
      
      if (noteId) {
        toast({
          title: "Upload Complete",
          description: processingError ? 
            "Your file has been uploaded with the original format and is being processed." :
            "Your file has been uploaded and is being processed.",
        });
        
        if (onUploadComplete) {
          onUploadComplete(noteId);
        } else {
          navigate(`/app/notes/${noteId}`);
        }
      }
    } catch (error) {
      setProcessingState('idle');
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const getButtonText = () => {
    if (processingState === 'processing') {
      return "Processing Audio...";
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
      {processingError && (
        <p className="mt-2 text-sm text-yellow-600">{processingError}</p>
      )}
    </div>
  );
};
