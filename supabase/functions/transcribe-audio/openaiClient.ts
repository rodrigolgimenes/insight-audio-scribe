
// This file contains the OpenAI API client for transcription

// For simplicity, we're now redirecting to the Python service
export async function transcribeAudio(audioData: Blob): Promise<{ text: string, task_id?: string }> {
  try {
    const transcriptionServiceUrl = Deno.env.get('TRANSCRIPTION_SERVICE_URL') || 'http://167.88.42.2:8001';
    console.log('[transcribe-audio] Using transcription service URL:', transcriptionServiceUrl);
    
    // Log info about the audio
    console.log('[transcribe-audio] Audio content type:', audioData.type, 'size:', `${Math.round(audioData.size/1024/1024*100)/100} MB`);
    
    // Create form data for the file
    const formData = new FormData();
    formData.append('file', audioData, 'audio.mp3');
    
    // Start transcription and get task ID - Using /api/transcribe endpoint
    const response = await fetch(`${transcriptionServiceUrl}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      if (response.status === 422) {
        throw new Error('Invalid audio format or missing file');
      } else {
        throw new Error(`Transcription service returned status ${response.status}`);
      }
    }
    
    const result = await response.json();
    console.log('[transcribe-audio] Transcription service response:', result);
    
    if (result.error) {
      throw new Error(`Transcription failed: ${result.error}`);
    }
    
    if (!result.task_id && !result.id) {
      throw new Error('No task ID returned from transcription service');
    }
    
    // Use either task_id or id field from the response
    const task_id = result.task_id || result.id;
    
    if (!task_id) {
      throw new Error('Task ID is empty or invalid');
    }
    
    console.log('[transcribe-audio] Transcription task created with ID:', task_id);
    
    return { text: '', task_id };
    
  } catch (error) {
    console.error('[transcribe-audio] Error in transcription:', error);
    throw error;
  }
}
