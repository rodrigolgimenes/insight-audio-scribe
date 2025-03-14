
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

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    
    // Verificar se é um arquivo de vídeo para mostrar mensagem de processamento
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
      // Verificação adicional se o arquivo é um vídeo ou áudio que precisa de conversão
      if (audioProcessor.needsProcessing(file)) {
        console.log("File needs processing before upload:", file.type);
      }

      const noteId = await handleFileUpload(e, initiateTranscription);
      setProcessingState('idle');
      
      if (noteId) {
        toast({
          title: "Upload Complete",
          description: "Your file has been uploaded and is being processed.",
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
    </div>
  );
};
