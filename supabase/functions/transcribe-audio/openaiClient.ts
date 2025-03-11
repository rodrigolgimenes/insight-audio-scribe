
import { TranscriptionResult } from './types.ts';
import { withRetry } from './retryUtils.ts';

export async function transcribeAudio(audioData: Blob): Promise<TranscriptionResult> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('Missing OpenAI API key');
  }

  // Check the content type of the blob
  const contentType = audioData.type || 'audio/webm';
  
  console.log(`[transcribe-audio] Audio content type: ${contentType}, size: ${audioData.size} bytes`);
  
  // Determine if we need to convert based on MIME type
  // OpenAI accepts mp3, mp4, mpeg, mpga, m4a, wav, and webm
  const acceptedMimeTypes = [
    'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/mpga', 
    'audio/m4a', 'audio/wav', 'audio/webm'
  ];
  
  const isAcceptedType = acceptedMimeTypes.some(type => 
    contentType.includes(type.split('/')[1])
  );
  
  // Use the original blob if possible, otherwise make a new one with explicit MIME type
  const finalBlob = isAcceptedType 
    ? audioData 
    : new Blob([audioData], { type: 'audio/mp3' });

  console.log(`[transcribe-audio] Using ${isAcceptedType ? 'original' : 'converted'} blob with type: ${finalBlob.type}`);

  const formData = new FormData();
  formData.append('file', finalBlob, 'audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');

  return await withRetry(
    async () => {
      console.log('[transcribe-audio] Sending to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || response.statusText;
        console.error(`[transcribe-audio] OpenAI API error: ${errorMsg}, status: ${response.status}`);
        throw new Error(`OpenAI API error: ${errorMsg}`);
      }

      const result = await response.json();
      
      if (!result.text) {
        throw new Error('No transcription text received from OpenAI');
      }

      return result;
    },
    {
      maxAttempts: 3,
      baseDelay: 10000,
      shouldRetry: (error) => {
        return error.message.includes('rate limit') || 
               error.message.includes('server error');
      }
    }
  );
}
