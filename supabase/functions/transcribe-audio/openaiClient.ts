
import { TranscriptionResult } from './types.ts';
import { withRetry } from './retryUtils.ts';

export async function transcribeAudio(audioData: Blob): Promise<TranscriptionResult> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('Missing OpenAI API key');
  }

  // Convert blob to mp3 if needed
  const finalBlob = audioData.type.includes('audio/webm') 
    ? new Blob([audioData], { type: 'audio/mp3' })
    : audioData;

  const formData = new FormData();
  formData.append('file', finalBlob, 'audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');

  return await withRetry(
    async () => {
      console.log('[openaiClient] Sending to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[openaiClient] OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.text) {
        console.error('[openaiClient] No transcription text received:', result);
        throw new Error('No transcription text received from OpenAI');
      }

      console.log('[openaiClient] Transcription successful');
      return result;
    },
    {
      maxAttempts: 3,
      baseDelay: 10000,
      shouldRetry: (error) => {
        const message = error.message.toLowerCase();
        return message.includes('rate limit') || 
               message.includes('server error') ||
               message.includes('network error');
      }
    }
  );
}
