
import { createSupabaseClient, updateRecordingStatus, getRecordingData, createOrGetNote, updateNoteStatus, handleProcessingError, checkFileSize } from "./utils.ts";
import { ProcessRecordingRequest, ProcessResponse } from "./types.ts";

export async function processRecording(request: ProcessRecordingRequest): Promise<ProcessResponse> {
  const { recordingId, noteId, startImmediately, priority } = request;

  if (!recordingId) {
    throw new Error('Recording ID is required');
  }

  console.log('[process-recording] Processing recording:', recordingId);
  console.log('[process-recording] Note ID (if provided):', noteId);
  console.log('[process-recording] Start immediately:', !!startImmediately);
  console.log('[process-recording] Priority:', priority || 'normal');

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
  
  // Check the real file size
  let realFileSize = 0;
  try {
    // Try to get the real file size using a HEAD request
    const { data: fileInfo } = await supabase.storage
      .from('audio_recordings')
      .getPublicUrl(recording.file_path || '');
      
    if (fileInfo?.publicUrl) {
      const response = await fetch(fileInfo.publicUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        realFileSize = parseInt(contentLength, 10);
        console.log('[process-recording] Real file size from HEAD request:', realFileSize, 'bytes', `(${Math.round(realFileSize/1024/1024*100)/100} MB)`);
      }
    }
  } catch (headError) {
    console.error('[process-recording] Error getting file size from HEAD request:', headError);
  }
  
  // Use the real file size if available, otherwise use the default check
  let fileSizeInfo;
  if (realFileSize > 0) {
    // Create a simulated fileData object with the real size
    const simulatedFileData = [{
      metadata: { size: realFileSize }
    }];
    fileSizeInfo = checkFileSize(simulatedFileData);
  } else {
    // Use the default check
    fileSizeInfo = checkFileSize(fileData || []);
  }
  
  const { isLargeFile, isExtremelyLargeFile } = fileSizeInfo;
  console.log('[process-recording] Is large file:', isLargeFile);
  console.log('[process-recording] Is extremely large file:', isExtremelyLargeFile);

  // Update status to processing
  await updateRecordingStatus(supabase, recordingId, 'processing');

  // Create or get existing note
  const note = await createOrGetNote(supabase, recordingId, recording, noteId);
  console.log('[process-recording] Note:', note);

  // For larger files, use a different strategy
  // If the size is larger than 15MB (~15 minutes of audio) or if we detect it as a large file,
  // we'll use the specific process for large files
  const functionToInvoke = isLargeFile || realFileSize > 15 * 1024 * 1024 ? 
    'process-large-recording' : 
    'transcribe-audio';

  console.log(`[process-recording] Using function: ${functionToInvoke} for processing`);

  // Immediately update status to transcribing with higher progress
  // to indicate active processing has started
  await updateNoteStatus(supabase, note.id, 'transcribing', 15);

  // Implement retry logic for the edge function call
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  let lastError = null;

  // Determine if we should process with higher priority
  const isPriorityRequest = priority === 'high' || startImmediately === true;
  const waitTime = isPriorityRequest ? 1000 : 5000;

  // Start transcription in background
  EdgeRuntime.waitUntil((async () => {
    try {
      console.log(`[process-recording] Starting transcription process with '${functionToInvoke}'`);
      console.log(`[process-recording] Priority request: ${isPriorityRequest}, wait time: ${waitTime}ms`);
      
      // Give Storage time to process the file
      // Use shorter wait time for priority requests
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
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
                isExtremelyLargeFile,
                priority: isPriorityRequest ? 'high' : 'normal'
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
