
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

  // Start transcription in background
  EdgeRuntime.waitUntil((async () => {
    try {
      console.log(`[process-recording] Starting transcription process with '${functionToInvoke}'`);
      
      // Update note status to transcribing
      await updateNoteStatus(supabase, note.id, 'transcribing', 10);
      
      // Give Storage time to process the file
      await new Promise(resolve => setTimeout(resolve, 5000));
      
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
        console.error('[process-recording] Transcription error:', transcribeError);
        throw transcribeError;
      }

      console.log('[process-recording] Transcription started successfully');
    } catch (error) {
      await handleProcessingError(supabase, recordingId, note.id, error);
    }
  })());

  return { success: true, noteId: note.id };
}
