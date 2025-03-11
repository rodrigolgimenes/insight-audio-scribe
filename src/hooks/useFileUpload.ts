
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getMediaDuration } from "@/utils/mediaUtils";
import { validateFile, showValidationError } from "@/utils/upload/fileValidation";
import { uploadFileToSupabase } from "@/services/supabase/uploadService";
import { createRecordingEntry, updateRecordingStatus, createInitialNote, startRecordingProcessing } from "@/services/recording/recordingService";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<string | undefined> => {
    const file = event.target.files?.[0];
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      showValidationError(validation.errorMessage || "Invalid file");
      return;
    }

    setIsUploading(true);

    try {
      // Get file duration
      console.log('Getting media duration...');
      let durationInMs = 0;
      
      try {
        durationInMs = await getMediaDuration(file!);
        console.log('Successfully got media duration:', durationInMs);
      } catch (durationError) {
        console.error('Error getting media duration:', durationError);
        // Default to 0 if we can't get duration
      }

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file name
      const fileName = `${user.id}/${Date.now()}_${file!.name.replace(/[^\x00-\x7F]/g, '')}`;

      // Create initial recording entry in database
      const recordingData = await createRecordingEntry(
        user.id,
        file!.name || `Recording ${new Date().toLocaleString()}`,
        fileName,
        durationInMs
      );

      // Upload file to storage
      const { error: uploadError } = await uploadFileToSupabase(fileName, file!);

      if (uploadError) {
        // Clean up the recording entry if upload fails
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);
          
        throw uploadError;
      }

      // Update recording status to uploaded
      await updateRecordingStatus(recordingData.id, 'uploaded');

      // Create initial note entry
      await createInitialNote(
        recordingData.title,
        recordingData.id,
        user.id,
        durationInMs
      );

      // Start background processing
      const { error } = await startRecordingProcessing(recordingData.id);
      
      if (error) {
        console.error('Error starting transcription:', error);
        toast({
          title: "Warning",
          description: "File uploaded but transcription failed to start. It will retry automatically.",
          variant: "destructive",
        });
      }

      // Show success message
      toast({
        title: "Success",
        description: "File uploaded successfully! You can track the transcription progress in the dashboard.",
      });

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Return the recording ID for the component to use if needed
      return recordingData.id;

    } catch (error) {
      console.error('Error uploading file:', error);
      
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
