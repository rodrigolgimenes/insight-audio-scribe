
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
import { convertFileToMp3 } from "@/utils/audio/fileConverter";
import { ConversionLogsPanel } from './ConversionLogsPanel';
import { clearLogs } from '@/lib/logger';
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";

interface FileUploadProps {
  onUploadComplete?: (noteId: string, recordingId: string) => void;
  onConversionUpdate?: (
    status: 'idle' | 'converting' | 'success' | 'error',
    progress: number,
    originalFile: File | null,
    convertedFile: File | null
  ) => void;
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
  onConversionUpdate,
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
  const [processingState, setProcessingState] = useState<'idle' | 'validating' | 'converting' | 'uploading'>('idle');
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [showConversionLogs, setShowConversionLogs] = useState<boolean>(false);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const originalFile = e.target.files[0];
    setProcessingError(null);
    setProcessingProgress(0);
    setSelectedFileName(originalFile.name);
    
    clearLogs();
    setConversionStatus('idle');
    setConversionProgress(0);
    setOriginalFile(originalFile);
    setConvertedFile(null);
    setShowConversionLogs(true);
    
    if (onConversionUpdate) {
      onConversionUpdate('idle', 0, originalFile, null);
    }
    
    setProcessingState('validating');
    const validation = validateFile(originalFile);
    if (!validation.isValid) {
      showValidationError(validation.errorMessage || "Invalid file");
      setProcessingError(validation.errorMessage || "Invalid file format");
      setProcessingState('idle');
      setConversionStatus('error');
      
      if (onConversionUpdate) {
        onConversionUpdate('error', 0, originalFile, null);
      }
      
      return;
    }
    
    const isVideo = originalFile.type.startsWith('video/');
    const isAudio = originalFile.type.startsWith('audio/');
    const isMp3 = originalFile.type === 'audio/mp3' || 
                 originalFile.type === 'audio/mpeg' || 
                 originalFile.name.toLowerCase().endsWith('.mp3');
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : 'file';
    
    console.log(`Processing file: ${originalFile.name}, type: ${originalFile.type}, isMp3: ${isMp3}`);

    if (isVideo) {
      toast({
        title: "Processing Video",
        description: "Your video will be uploaded and processed for audio extraction. This may take a moment...",
      });
    } else if (isAudio) {
      toast({
        title: "Processing Audio",
        description: isMp3 ? "Your MP3 will be processed directly." : "Your audio will be converted to MP3 and processed. This may take a moment...",
      });
    } else {
      toast({
        title: "Processing File",
        description: "Attempting to process file. This may take a moment...",
      });
    }

    try {
      let fileToUpload = originalFile;
      
      // Only convert non-MP3 audio files or video files
      if ((isAudio && !isMp3) || isVideo) {
        setProcessingState('converting');
        setConversionStatus('converting');
        
        if (onConversionUpdate) {
          onConversionUpdate('converting', 0, originalFile, null);
        }
        
        toast({
          title: "Converting Audio",
          description: "Converting your audio to MP3 format for better compatibility...",
        });
        
        try {
          if (isAudio && !isMp3) {
            const compressedBlob = await audioCompressor.compressAudio(originalFile, {
              targetBitrate: 48,
              mono: false,
              targetSampleRate: 44100
            });
            
            fileToUpload = new File(
              [compressedBlob], 
              originalFile.name.replace(/\.[^/.]+$/, "") + ".mp3", 
              { 
                type: 'audio/mp3',
                lastModified: Date.now()
              }
            );
            
            console.log(`Converted ${originalFile.name} to MP3. New size: ${Math.round(fileToUpload.size / 1024)}KB`);
          } else if (isVideo) {
            fileToUpload = await convertFileToMp3(originalFile, (progress) => {
              setProcessingProgress(progress);
              setConversionProgress(progress);
              
              if (onConversionUpdate) {
                onConversionUpdate('converting', progress, originalFile, null);
              }
            });
            
            console.log(`Extracted audio from video ${originalFile.name} to MP3. Size: ${Math.round(fileToUpload.size / 1024)}KB`);
          }
          
          setConvertedFile(fileToUpload);
          setConversionStatus('success');
          
          const isValidMp3 = await validateMp3File(fileToUpload);
          if (!isValidMp3) {
            toast({
              title: "Warning",
              description: "MP3 conversion completed but the file structure might not be optimal. Proceeding anyway.",
              variant: "destructive",
            });
          }
          
          if (onConversionUpdate) {
            onConversionUpdate('success', 100, originalFile, fileToUpload);
          }
          
          toast({
            title: "Conversion Complete",
            description: "Audio successfully converted to MP3 format.",
          });
        } catch (conversionError) {
          console.error("Audio conversion error:", conversionError);
          setConversionStatus('error');
          
          if (onConversionUpdate) {
            onConversionUpdate('error', 0, originalFile, null);
          }
          
          toast({
            title: "Conversion Failed",
            description: "Failed to convert audio to MP3. Using original format.",
            variant: "destructive",
          });
          fileToUpload = originalFile;
        }
      } else if (isMp3) {
        // If it's already an MP3, mark conversion as successful without actually converting
        console.log(`File ${originalFile.name} is already MP3. Skipping conversion.`);
        setConversionStatus('success');
        setConversionProgress(100);
        setConvertedFile(originalFile);
        setProcessingProgress(20);
        
        if (onConversionUpdate) {
          onConversionUpdate('success', 100, originalFile, originalFile);
        }
        
        toast({
          title: "Processing MP3",
          description: "Your MP3 file will be processed directly.",
        });
      }
      
      setProcessingState('uploading');
      setProcessingProgress(20);
      
      if (fileToUpload.name.indexOf('.') === -1) {
        const extension = isVideo ? '.mp4' : isAudio ? '.mp3' : '.bin';
        const newFileName = fileToUpload.name + extension;
        fileToUpload = new File([fileToUpload], newFileName, { type: fileToUpload.type });
      }
      
      console.log(`Uploading file: ${fileToUpload.name}, type: ${fileToUpload.type}, size: ${Math.round(fileToUpload.size / 1024)}KB`);
      
      const result = await handleFileUpload(e, initiateTranscription, fileToUpload);
      
      if (result?.noteId && result?.recordingId) {
        setCurrentNoteId(result.noteId);
        setCurrentRecordingId(result.recordingId);
        
        await supabase
          .from('processing_logs')
          .insert({
            recording_id: result.recordingId,
            note_id: result.noteId,
            stage: 'file_uploaded',
            message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file uploaded successfully`,
            details: { 
              fileName: fileToUpload.name, 
              fileType: fileToUpload.type, 
              fileSize: `${Math.round(fileToUpload.size / 1024 / 1024 * 100) / 100} MB`,
              needsAudioExtraction: isVideo,
              isMp3: isMp3
            },
            status: 'success'
          });
          
        if (isVideo) {
          await supabase
            .from('processing_logs')
            .insert({
              recording_id: result.recordingId,
              note_id: result.noteId,
              stage: 'extraction_started',
              message: 'Video detected, audio extraction required',
              details: { 
                fileName: fileToUpload.name, 
                fileType: fileToUpload.type
              },
              status: 'info'
            });
            
          await supabase
            .from('recordings')
            .update({ 
              needs_audio_extraction: true,
              original_file_type: fileToUpload.type,
              original_file_path: fileToUpload.name
            })
            .eq('id', result.recordingId);
        }
      }
      
      setProcessingState('idle');
      setProcessingProgress(100);
      
      if (result?.noteId) {
        toast({
          title: "Upload Complete",
          description: "Your file has been uploaded and is being processed on our servers.",
        });
        
        if (onUploadComplete && result.recordingId) {
          onUploadComplete(result.noteId, result.recordingId);
        } else {
          navigate(`/app/notes/${result.noteId}`);
        }
      }
    } catch (error) {
      setProcessingState('idle');
      setProcessingProgress(0);
      setConversionStatus('error');
      
      if (onConversionUpdate) {
        onConversionUpdate('error', 0, originalFile, null);
      }
      
      console.error("File upload error:", error);
      
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

  const validateMp3File = async (file: File): Promise<boolean> => {
    try {
      const reader = new FileReader();
      return await new Promise((resolve) => {
        reader.onload = (e) => {
          const result = e.target?.result;
          if (!result || typeof result === 'string') {
            resolve(false);
            return;
          }
          
          const arr = new Uint8Array(result);
          if (arr.length < 4) {
            resolve(false);
            return;
          }
          
          const isValidHeader = 
            (arr[0] === 0xFF && (arr[1] & 0xE0) === 0xE0) || // MPEG frame sync
            (arr[0] === 0x49 && arr[1] === 0x44 && arr[2] === 0x33); // ID3v2 tag
            
          resolve(isValidHeader);
        };
        
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 4));
      });
    } catch (e) {
      console.error("Error validating MP3 file:", e);
      return false;
    }
  };

  const handleDownloadConvertedFile = () => {
    if (convertedFile) {
      const url = URL.createObjectURL(convertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getButtonText = () => {
    if (processingState === 'validating') {
      return "Validating file...";
    } else if (processingState === 'converting') {
      return "Converting audio...";
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
        className={`bg-primary hover:bg-primary/90 text-white ${buttonClassName}`}
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
            {processingState === 'converting' && `Converting to MP3: ${processingProgress}%`}
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
      
      {currentRecordingId && processingState === 'idle' && processingProgress === 100 && (
        <div className="mt-4">
          <ProcessingLogs recordingId={currentRecordingId} noteId={currentNoteId || undefined} />
        </div>
      )}
    </div>
  );
}
