
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
    console.log('Starting file upload process...');

    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(authError ? authError.message : 'User not authenticated');
      }

      // Get file duration
      console.log('Getting media duration...');
      let durationInMs = 0;
      
      try {
        durationInMs = await getMediaDuration(file!);
        console.log('Successfully got media duration:', durationInMs);
      } catch (durationError) {
        console.error('Error getting media duration:', durationError);
        // Default to 0 if we can't get duration, but continue the process
      }

      // Generate unique file name with sanitization
      const timestamp = Date.now();
      const sanitizedFileName = file!.name.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_');
      const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`;
      console.log('Sanitized file name:', fileName);

      // Create initial recording entry in database
      console.log('Creating recording entry...');
      const recordingData = await createRecordingEntry(
        user.id,
        file!.name || `Recording ${new Date().toLocaleString()}`,
        fileName,
        durationInMs
      );
      console.log('Recording entry created with ID:', recordingData.id);

      // Upload file to storage with retries
      console.log('Uploading file to storage...');
      let uploadSuccess = false;
      let uploadAttempts = 0;
      const maxUploadAttempts = 3;
      let uploadError = null;

      while (!uploadSuccess && uploadAttempts < maxUploadAttempts) {
        try {
          const { error } = await uploadFileToSupabase(fileName, file!);
          
          if (!error) {
            uploadSuccess = true;
            console.log('File uploaded successfully on attempt', uploadAttempts + 1);
          } else {
            uploadError = error;
            console.error(`Upload attempt ${uploadAttempts + 1} failed:`, error);
            uploadAttempts++;
            
            if (uploadAttempts < maxUploadAttempts) {
              // Wait before retrying (exponential backoff)
              const waitTime = Math.min(2000 * Math.pow(2, uploadAttempts), 10000);
              console.log(`Waiting ${waitTime}ms before retrying upload...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } catch (error) {
          uploadError = error;
          console.error(`Upload attempt ${uploadAttempts + 1} failed with exception:`, error);
          uploadAttempts++;

          if (uploadAttempts < maxUploadAttempts) {
            const waitTime = Math.min(2000 * Math.pow(2, uploadAttempts), 10000);
            console.log(`Waiting ${waitTime}ms before retrying upload...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      if (!uploadSuccess) {
        // Clean up the recording entry if upload fails after all retries
        console.error('All upload attempts failed, cleaning up recording entry...');
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);
          
        throw uploadError || new Error('Failed to upload file after multiple attempts');
      }

      // Update recording status to uploaded
      console.log('Updating recording status to uploaded...');
      await updateRecordingStatus(recordingData.id, 'uploaded');

      // Create initial note entry
      console.log('Creating initial note entry...');
      await createInitialNote(
        recordingData.title,
        recordingData.id,
        user.id,
        durationInMs
      );

      // Start background processing with retries
      console.log('Starting transcription processing...');
      let processingSuccess = false;
      let processingAttempts = 0;
      const maxProcessingAttempts = 3;
      let processingError = null;

      while (!processingSuccess && processingAttempts < maxProcessingAttempts) {
        try {
          const { error } = await startRecordingProcessing(recordingData.id);
          
          if (!error) {
            processingSuccess = true;
            console.log('Processing started successfully on attempt', processingAttempts + 1);
          } else {
            processingError = error;
            console.error(`Processing start attempt ${processingAttempts + 1} failed:`, error);
            processingAttempts++;
            
            if (processingAttempts < maxProcessingAttempts) {
              // Wait before retrying (exponential backoff)
              const waitTime = Math.min(2000 * Math.pow(2, processingAttempts), 10000);
              console.log(`Waiting ${waitTime}ms before retrying processing start...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } catch (error) {
          processingError = error;
          console.error(`Processing start attempt ${processingAttempts + 1} failed with exception:`, error);
          processingAttempts++;

          if (processingAttempts < maxProcessingAttempts) {
            const waitTime = Math.min(2000 * Math.pow(2, processingAttempts), 10000);
            console.log(`Waiting ${waitTime}ms before retrying processing start...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!processingSuccess) {
        console.error('All processing start attempts failed');
        toast({
          title: "Warning",
          description: "File uploaded but transcription failed to start. You can try the 'Retry Transcription' button.",
          variant: "destructive",
        });
      } else {
        // Show success message
        toast({
          title: "Success",
          description: "File uploaded successfully! Transcription is being processed.",
        });
      }

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Return the recording ID for the component to use if needed
      return recordingData.id;

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
