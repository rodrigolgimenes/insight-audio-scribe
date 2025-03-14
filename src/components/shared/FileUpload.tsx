
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileUpload } from "@/hooks/upload/useFileUpload";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { validateFile, showValidationError } from "@/utils/upload/fileValidation";
import { supabase } from "@/integrations/supabase/client";
import { ProcessingLogs } from "@/components/record/ProcessingLogs";

interface FileUploadProps {
  onUploadComplete?: (noteId: string, recordingId: string) => void;
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
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

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
    
    // Validate file
    setProcessingState('validating');
    const validation = validateFile(file);
    if (!validation.isValid) {
      showValidationError(validation.errorMessage || "Invalid file");
      setProcessingError(validation.errorMessage || "Invalid file format");
      setProcessingState('idle');
      return;
    }
    
    // Determine file type
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : 'file';
    
    // Show appropriate message based on file type
    if (isVideo) {
      toast({
        title: "Processing Video",
        description: "Your video will be uploaded and processed for audio extraction. This may take a moment...",
      });
    } else if (isAudio) {
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
      const { noteId, recordingId } = await handleFileUpload(e, initiateTranscription, file);
      
      if (noteId && recordingId) {
        setCurrentNoteId(noteId);
        setCurrentRecordingId(recordingId);
        
        // Create initial log entry
        await supabase
          .from('processing_logs')
          .insert({
            recording_id: recordingId,
            note_id: noteId,
            stage: 'file_uploaded',
            message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file uploaded successfully`,
            details: { 
              fileName: file.name, 
              fileType: file.type, 
              fileSize: `${Math.round(file.size / 1024 / 1024 * 100) / 100} MB`,
              needsAudioExtraction: isVideo
            },
            status: 'success'
          });
          
        // If it's a video file, add a log about needing audio extraction
        if (isVideo) {
          await supabase
            .from('processing_logs')
            .insert({
              recording_id: recordingId,
              note_id: noteId,
              stage: 'extraction_started',
              message: 'Video detected, audio extraction required',
              details: { 
                fileName: file.name, 
                fileType: file.type
              },
              status: 'info'
            });
            
          // Update the recording to indicate it needs audio extraction
          await supabase
            .from('recordings')
            .update({ 
              needs_audio_extraction: true,
              original_file_type: file.type,
              original_file_path: file.name
            })
            .eq('id', recordingId);
        }
      }
      
      setProcessingState('idle');
      setProcessingProgress(100);
      
      if (noteId) {
        toast({
          title: "Upload Complete",
          description: "Your file has been uploaded and is being processed on our servers.",
        });
        
        if (onUploadComplete && recordingId) {
          onUploadComplete(noteId, recordingId);
        } else {
          navigate(`/app/notes/${noteId}`);
        }
      }
    } catch (error) {
      setProcessingState('idle');
      setProcessingProgress(0);
      console.error("File upload error:", error);
      
      // Log error to processing logs if we have a recording ID
      if (currentRecordingId && currentNoteId) {
        await supabase
          .from('processing_logs')
          .insert({
            recording_id: currentRecordingId,
            note_id: currentNoteId,
            stage: 'upload_error',
            message: 'Error during file upload',
            details: { error: error instanceof Error ? error.message : String(error) },
            status: 'error'
          });
      }
      
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
      
      {/* Show processing logs for the current upload */}
      {currentRecordingId && processingState === 'idle' && processingProgress === 100 && (
        <div className="mt-4">
          <ProcessingLogs recordingId={currentRecordingId} noteId={currentNoteId || undefined} />
        </div>
      )}
    </div>
  );
};
