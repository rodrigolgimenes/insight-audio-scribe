import { supabase } from "@/integrations/supabase/client";
import { validateFile, showValidationError } from "@/utils/upload/fileValidation";
import { getMediaDuration } from "@/utils/mediaUtils";
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

      // Ensure file has the correct MIME type
      let processedFile = file;
      
      // Verify MIME type and fix if necessary
      if (!processedFile.type.includes('mp3') && !processedFile.type.includes('mpeg')) {
        console.log('Ensuring file has audio/mp3 MIME type...');
        // Create a new File with proper MIME type
        try {
          const arrayBuffer = await processedFile.arrayBuffer();
          processedFile = new File(
            [arrayBuffer], 
            processedFile.name.replace(/\.[^/.]+$/, '') + '.mp3',
            { type: 'audio/mp3' }
          );
          console.log('File type set to audio/mp3:', processedFile.type);
        } catch (typeError) {
          console.error('Error setting file MIME type:', typeError);
          // Continue with original file as last resort
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
      // Always ensure the file has .mp3 extension
      const fileName = `${user.id}/${timestamp}_${sanitizedFileName.replace(/\.[^/.]+$/, '')}.mp3`;
      console.log('Sanitized file name:', fileName);

      // Create initial recording entry in database
      console.log('Creating recording entry...');
      const recordingData = await createRecordingEntry(
        user.id,
        processedFile.name || `Recording ${new Date().toLocaleString()}`,
        fileName,
        durationInMs
      );
      console.log('Recording entry created with ID:', recordingData.id);

      // Upload file to storage with retries and explicit content type
      const uploadResult = await uploadFileWithRetries(fileName, processedFile);
      if (!uploadResult.success) {
        // Clean up the recording entry if upload fails
        await cleanupFailedRecording(recordingData.id);
        throw uploadResult.error;
      }

      // Verify the file was uploaded with correct content type
      try {
        const { data: fileInfo } = await supabase.storage
          .from('audio_recordings')
          .getPublicUrl(fileName);
          
        console.log('File uploaded with public URL:', fileInfo.publicUrl);
        
        // Update recording with additional metadata about the file
        await supabase
          .from('recordings')
          .update({
            file_mime_type: 'audio/mp3',
            original_file_type: file.type, // Store the original file type for reference
            original_file_size: file.size,
            processed_file_size: processedFile.size
          })
          .eq('id', recordingData.id);
      } catch (infoError) {
        console.error('Error getting file info:', infoError);
        // Non-fatal, continue process
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
      // Explicitly set content type to audio/mp3
      const { error } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, file, {
          contentType: 'audio/mp3',
          upsert: true
        });
      
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
