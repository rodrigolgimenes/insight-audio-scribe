
import { supabase } from "@/integrations/supabase/client";
import { validateFile, showValidationError } from "@/utils/upload/fileValidation";
import { getMediaDuration } from "@/utils/mediaUtils";
import { uploadFileToSupabase } from "@/services/supabase/uploadService";
import { createRecordingEntry, updateRecordingStatus } from "@/services/recording/recordingService";
import { audioProcessor } from "@/utils/audio/processing/AudioProcessor";

export const useFileUploadHandler = (
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: any
) => {
  const processFileUpload = async (
    file: File,
    initiateTranscription: boolean
  ): Promise<string | undefined> => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      showValidationError(validation.errorMessage || "Invalid file");
      return undefined;
    }

    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(authError ? authError.message : 'User not authenticated');
      }

      // Process file if needed (extract audio from video or convert to MP3)
      let processedFile = file;
      
      if (audioProcessor.needsProcessing(file)) {
        console.log('Processing file to extract audio or convert format...');
        try {
          processedFile = await audioProcessor.processFile(file);
          console.log('File processed successfully:', processedFile.name, processedFile.type, processedFile.size);
        } catch (processingError) {
          console.error('Error processing file:', processingError);
          toast({
            title: "Processing Warning",
            description: "Could not process file for optimal audio. Using original file instead.",
            variant: "warning",
          });
          // Continue with original file as fallback
        }
      }

      // Get file duration
      console.log('Getting media duration...');
      let durationInMs = 0;
      
      try {
        durationInMs = await getMediaDuration(processedFile);
        console.log('Successfully got media duration:', durationInMs);
      } catch (durationError) {
        console.error('Error getting media duration:', durationError);
        // Default to 0 if we can't get duration, but continue the process
      }

      // Generate unique file name with sanitization
      const timestamp = Date.now();
      const sanitizedFileName = processedFile.name.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_');
      // Always ensure the file has .mp3 extension if it's been processed
      const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`;
      console.log('Sanitized file name:', fileName);

      // Create initial recording entry in database
      console.log('Creating recording entry...');
      const recordingData = await createRecordingEntry(
        user.id,
        processedFile.name || `Recording ${new Date().toLocaleString()}`,
        fileName,
        durationInMs,
        'file' // Set mode to 'file' to indicate this was an uploaded file
      );
      console.log('Recording entry created with ID:', recordingData.id);

      // Upload file to storage with retries
      const uploadResult = await uploadFileWithRetries(fileName, processedFile);
      if (!uploadResult.success) {
        // Clean up the recording entry if upload fails
        await cleanupFailedRecording(recordingData.id);
        throw uploadResult.error;
      }

      // Update recording status to uploaded
      console.log('Updating recording status to uploaded...');
      await updateRecordingStatus(recordingData.id, 'uploaded');

      // Create initial note entry and start processing
      const noteId = await createNoteAndStartProcessing(
        user.id, 
        recordingData, 
        durationInMs, 
        initiateTranscription
      );
      
      return noteId;
    } catch (error) {
      throw error;
    }
  };

  return { processFileUpload };
};

async function uploadFileWithRetries(fileName: string, file: File): Promise<{ success: boolean, error?: Error }> {
  console.log('Uploading file to storage...');
  let uploadSuccess = false;
  let uploadAttempts = 0;
  const maxUploadAttempts = 3;
  let uploadError = null;

  while (!uploadSuccess && uploadAttempts < maxUploadAttempts) {
    try {
      const { error } = await uploadFileToSupabase(fileName, file);
      
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
    return { 
      success: false, 
      error: uploadError || new Error('Failed to upload file after multiple attempts') 
    };
  }

  return { success: true };
}

async function cleanupFailedRecording(recordingId: string): Promise<void> {
  console.error('Upload failed after all retries, cleaning up recording entry...');
  await supabase
    .from('recordings')
    .delete()
    .eq('id', recordingId);
}

async function createNoteAndStartProcessing(
  userId: string, 
  recordingData: any, 
  durationInMs: number, 
  initiateTranscription: boolean
): Promise<string | undefined> {
  console.log('Creating initial note entry...');
  const { data: noteData, error: noteError } = await supabase
    .from('notes')
    .insert({
      title: recordingData.title,
      recording_id: recordingData.id,
      user_id: userId,
      status: 'pending',
      processing_progress: 0,
      processed_content: '',
      duration: durationInMs
    })
    .select('id')
    .single();
  
  if (noteError || !noteData) {
    console.error('Error creating note entry:', noteError);
    throw new Error(`Failed to create note: ${noteError?.message || 'Unknown error'}`);
  }
  
  console.log('Note created with ID:', noteData.id);

  // Start background processing if requested
  if (initiateTranscription) {
    await startProcessingWithRetries(recordingData.id, noteData.id);
  } else {
    console.log('Skipping transcription initiation as requested');
  }

  return noteData.id;
}

async function startProcessingWithRetries(recordingId: string, noteId: string): Promise<void> {
  console.log('Starting transcription processing...');
  let processingSuccess = false;
  let processingAttempts = 0;
  const maxProcessingAttempts = 3;
  let processingError = null;

  // Wait a bit to make sure the note is fully created in the database
  await new Promise(resolve => setTimeout(resolve, 1000));

  while (!processingSuccess && processingAttempts < maxProcessingAttempts) {
    try {
      const { error } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingId, noteId: noteId },
        });
      
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
}
