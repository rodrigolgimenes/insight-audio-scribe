import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, FileText, AlertCircle } from "lucide-react";
import { useFileUpload } from "@/hooks";
import { validateFile } from "@/utils/upload/fileValidation";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onUploadComplete?: (noteId: string) => void;
  label?: string;
  description?: string;
  accept?: string;
  buttonText?: string;
  className?: string;
  buttonClassName?: string;
  maxSize?: number;
  disabled?: boolean;
  initiateTranscription?: boolean;
}

export function FileUpload({
  onUploadComplete,
  label = "Upload file",
  description = "Upload an audio or video file to transcribe",
  accept = "audio/*,video/mp4",
  buttonText = "Upload File",
  className = "",
  buttonClassName = "",
  maxSize = 100,
  disabled = false,
  initiateTranscription = true,
}: FileUploadProps) {
  const { isUploading, handleFileUpload } = useFileUpload();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (file) {
      setFileName(file.name);
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        setError(validation.errorMessage || "Invalid file");
        return;
      }
      
      try {
        console.log("Initiating file upload with transcription flag:", initiateTranscription);
        const noteId = await handleFileUpload(event, initiateTranscription);
        
        if (noteId) {
          console.log("Upload complete, noteId:", noteId);
          
          if (!onUploadComplete) {
            console.log(`Navigating to dashboard after upload`);
            navigate(`/app`);
            
            setTimeout(async () => {
              const { data: note } = await supabase
                .from('notes')
                .select('status')
                .eq('id', noteId)
                .single();
                
              if (note && (note.status === 'pending' || note.status === 'uploaded')) {
                console.log("Auto-retrying transcription for note:", noteId);
                await supabase.functions.invoke('process-recording', {
                  body: { noteId: noteId }
                });
              }
            }, 3000);
          } else {
            console.log(`Calling onUploadComplete with noteId: ${noteId}`);
            onUploadComplete(noteId);
          }
          
          toast({
            title: "Upload successful",
            description: initiateTranscription 
              ? "Your file has been uploaded and transcription process started."
              : "Your file has been uploaded successfully.",
          });
        } else {
          toast({
            title: "Warning",
            description: "File was uploaded but something went wrong with the process. Please check your Dashboard.",
            variant: "destructive",
          });
          navigate("/app");
        }
      } catch (err) {
        console.error("File upload error:", err);
        setError(err instanceof Error ? err.message : "Failed to upload file");
        
        toast({
          title: "Upload Error",
          description: err instanceof Error ? err.message : "Failed to upload file",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label htmlFor="file-upload">{label}</Label>}
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      
      <div className="flex flex-col gap-4">
        <Input
          type="file"
          accept={accept}
          className="hidden"
          id="file-upload"
          onChange={handleFileChange}
          disabled={isUploading || disabled}
        />
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading || disabled}
            className={`bg-[#4285F4] hover:bg-[#3367D6] active:bg-[#2A56C6] text-white gap-2 w-full sm:w-auto ${buttonClassName}`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Uploading...' : buttonText}
          </Button>
          
          {fileName && !error && !isUploading && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-xs">{fileName}</span>
            </div>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}
        
        {isUploading && (
          <p className="text-sm text-blue-600">
            Uploading {fileName}... This may take a while for larger files.
          </p>
        )}
      </div>
    </div>
  );
}
