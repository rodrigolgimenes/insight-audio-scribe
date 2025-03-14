
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFileUploadHandler } from "@/hooks/upload/useFileUploadHandler";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { processFileUpload } = useFileUploadHandler(setIsUploading, toast);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    initiateTranscription: boolean = true,
    processedFile?: File
  ): Promise<string | undefined> => {
    try {
      setIsUploading(true);
      
      let file: File;
      
      // Use the pre-processed file if provided, otherwise use the file from the input
      if (processedFile) {
        file = processedFile;
        console.log("Using pre-processed file:", file.name, file.type, file.size);
      } else if (e.target.files && e.target.files.length > 0) {
        file = e.target.files[0];
        console.log("Using original file from input:", file.name, file.type, file.size);
      } else {
        throw new Error("No file selected");
      }

      // Process the file upload with the selected file
      const noteId = await processFileUpload(file, initiateTranscription);
      return noteId;
    } catch (error) {
      console.error("Error in handleFileUpload:", error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, handleFileUpload };
};
