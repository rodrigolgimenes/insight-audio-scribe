
import { createSupabaseClient, updateRecordingStatus, getRecordingData, createOrGetNote, updateNoteStatus, handleProcessingError, checkFileSize } from "./utils.ts";
import { ProcessRecordingRequest, ProcessResponse } from "./types.ts";

export async function processRecording(request: ProcessRecordingRequest): Promise<ProcessResponse> {
  const { recordingId, noteId } = request;

  if (!recordingId) {
    throw new Error('Recording ID is required');
  }

  console.log('[process-recording] Processing recording:', recordingId);
  console.log('[process-recording] Note ID (if provided):', noteId);

  const supabase = createSupabaseClient();

  // Fetch recording information
  const recording = await getRecordingData(supabase, recordingId);

  console.log('[process-recording] Recording data:', recording);
  console.log('[process-recording] Audio duration:', recording.duration, 'ms');

  // Check file size before processing
  const { data: fileData, error: fileError } = await supabase.storage
    .from('audio_recordings')
    .list(recording.file_path?.split('/')[0] || '', {
      search: recording.file_path?.split('/')[1] || ''
    });

  if (fileError) {
    console.error('[process-recording] Error checking file size:', fileError);
  }
  
  const { isLargeFile, isExtremelyLargeFile } = checkFileSize(fileData || []);
  console.log('[process-recording] Is large file:', isLargeFile);
  
  if (isExtremelyLargeFile) {
    console.log('[process-recording] This file is extremely large and may take longer to process');
  }

  // Update status to processing
  await updateRecordingStatus(supabase, recordingId, 'processing');

  // Create or get existing note
  const note = await createOrGetNote(supabase, recordingId, recording, noteId);
  console.log('[process-recording] Note:', note);

  // For larger files, use a different strategy
  const functionToInvoke = isLargeFile ? 
    'process-large-recording' : // A function we would create for handling large files
    'transcribe-audio';

  // Implement retry logic for the edge function call
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  let lastError = null;

  // Start transcription in background
  EdgeRuntime.waitUntil((async () => {
    try {
      console.log(`[process-recording] Starting transcription process with '${functionToInvoke}'`);
      
      // Update note status to transcribing
      await updateNoteStatus(supabase, note.id, 'transcribing', 10);
      
      // Give Storage time to process the file
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      while (retryCount < maxRetries && !success) {
        try {
          console.log(`[process-recording] Attempt ${retryCount + 1} of ${maxRetries}`);
          
          const { error: transcribeError } = await supabase.functions
            .invoke(functionToInvoke, {
              body: { 
                noteId: note.id,
                recordingId: recordingId,
                duration: recording.duration,
                isLargeFile,
                isExtremelyLargeFile
              }
            });

          if (transcribeError) {
            console.error(`[process-recording] Transcription error on attempt ${retryCount + 1}:`, transcribeError);
            lastError = transcribeError;
            
            // Check if this is a service unavailable error
            const isServiceUnavailable = transcribeError.message && (
              transcribeError.message.includes('503') ||
              transcribeError.message.includes('Service Unavailable') ||
              transcribeError.message.includes('non-2xx status code')
            );
            
            if (isServiceUnavailable) {
              // For service unavailable, wait longer before retry
              await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
            } else {
              await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
            }
          } else {
            success = true;
            break;
          }
        } catch (functionError) {
          console.error(`[process-recording] Function error on attempt ${retryCount + 1}:`, functionError);
          lastError = functionError;
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        }
        
        retryCount++;
      }
      
      if (!success) {
        // All retry attempts failed
        console.error('[process-recording] All transcription attempts failed after', retryCount, 'tries');
        
        // Handle service availability issues specifically
        const errorMessage = lastError?.message || 'Unknown error';
        const isServiceUnavailable = 
          errorMessage.includes('503') || 
          errorMessage.includes('Service Unavailable') ||
          errorMessage.includes('non-2xx status code');
          
        if (isServiceUnavailable) {
          await handleProcessingError(
            supabase, 
            recordingId, 
            note.id, 
            new Error('Edge Function service is currently unavailable. Please try again later.')
          );
        } else {
          await handleProcessingError(supabase, recordingId, note.id, lastError || new Error('Maximum retry attempts exceeded'));
        }
        return;
      }

      console.log('[process-recording] Transcription started successfully');
    } catch (error) {
      await handleProcessingError(supabase, recordingId, note.id, error);
    }
  })());

  return { success: true, noteId: note.id };
}
