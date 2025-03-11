
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFileUploadHandler } from "./useFileUploadHandler";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { processFileUpload } = useFileUploadHandler(setIsUploading, toast);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    initiateTranscription: boolean = true
  ): Promise<string | undefined> => {
    const file = event.target.files?.[0];
    
    if (!file) return undefined;
    
    setIsUploading(true);
    console.log('Starting file upload process with initiateTranscription:', initiateTranscription);

    try {
      const noteId = await processFileUpload(file, initiateTranscription);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      return noteId;
    } catch (error) {
      console.error('Error in file upload process:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Error processing file: ${error.message}` 
          : "Error processing file. Please try again.",
        variant: "destructive",
      });
      
      return undefined;
    } finally {
      setIsUploading(false);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return {
    isUploading,
    handleFileUpload
  };
};
