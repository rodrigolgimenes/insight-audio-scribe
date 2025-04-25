import { createOpenAIClient } from './openaiConfig.ts';

export async function transcribeAudio(audioData: Blob): Promise<{ text: string }> {
  console.log('[transcribe-audio] Starting transcription with custom VPS API...');
  
  try {
    // Ensure the blob has the correct MIME type
    let audioBlob = audioData;
    
    // Create a form for multipart/form-data upload
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    
    // Log audio content details for debugging
    console.log(`[transcribe-audio] Audio content type: ${audioBlob.type}, size: ${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    
    console.log('[transcribe-audio] Sending request to VPS Transcription API...');
    
    // Send the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout
    
    const response = await fetch('http://167.88.42.2:8001/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[transcribe-audio] VPS API Error (${response.status}):`, errorData);
      throw new Error(`VPS API Error (${response.status}): ${errorData}`);
    }

    const result = await response.json();
    console.log('[transcribe-audio] Transcription successful');
    
    // Check for the text in the response (assuming the API returns a similar structure)
    // Adjust this based on the actual response structure from your VPS API
    const transcriptionText = result.text || result.transcription || '';
    
    if (!transcriptionText) {
      console.warn('[transcribe-audio] Transcription returned empty text');
    }
    
    return { text: transcriptionText || '' };
  } catch (error) {
    console.error('[transcribe-audio] Error in transcription:', error);
    console.error('[transcribe-audio] Stack:', error.stack);
    throw error;
  }
}
