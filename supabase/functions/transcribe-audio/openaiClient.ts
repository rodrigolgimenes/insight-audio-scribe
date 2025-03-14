
import { createOpenAIClient } from './openaiConfig.ts';

export async function transcribeAudio(audioData: Blob): Promise<{ text: string }> {
  console.log('[transcribe-audio] Starting transcription...');
  const openai = createOpenAIClient();
  
  if (!openai) {
    throw new Error('OpenAI client not initialized - check API key');
  }
  
  try {
    // Ensure the blob has the correct MIME type
    let audioBlob = audioData;
    
    // Always ensure the blob is MP3 format to avoid issues with the API
    if (!audioBlob.type.includes('audio/mp3') && !audioBlob.type.includes('audio/mpeg')) {
      console.log(`[transcribe-audio] Converting blob with type: ${audioBlob.type} to audio/mp3`);
      
      // Create a new blob with the correct MIME type
      const arrayBuffer = await audioBlob.arrayBuffer();
      audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      
      console.log(`[transcribe-audio] New blob type: ${audioBlob.type}, size: ${audioBlob.size} bytes`);
    }
    
    // Verify the audio content is not empty
    if (audioBlob.size === 0) {
      throw new Error('Audio content is empty (0 bytes). Cannot transcribe empty audio.');
    }
    
    // Log audio content details for debugging
    console.log(`[transcribe-audio] Audio content type: ${audioBlob.type}, size: ${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Portuguese language detection
    
    // Add transcription options for improved quality
    formData.append('response_format', 'json');
    formData.append('temperature', '0');
    
    console.log('[transcribe-audio] Sending request to OpenAI Whisper API...');
    
    // Send the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[transcribe-audio] OpenAI API Error (${response.status}):`, errorData);
      throw new Error(`OpenAI API Error (${response.status}): ${errorData}`);
    }

    const result = await response.json();
    console.log('[transcribe-audio] Transcription successful');
    
    if (!result.text) {
      console.warn('[transcribe-audio] Transcription returned empty text');
    }
    
    return { text: result.text || '' };
  } catch (error) {
    console.error('[transcribe-audio] Error in transcription:', error);
    console.error('[transcribe-audio] Stack:', error.stack);
    throw error;
  }
}
