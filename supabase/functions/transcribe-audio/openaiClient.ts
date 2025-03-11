
import { TranscriptionResult } from './types.ts';
import { withRetry } from './retryUtils.ts';

export async function transcribeAudio(audioData: Blob): Promise<TranscriptionResult> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('Missing OpenAI API key');
  }

  // Check the content type and size of the blob
  const contentType = audioData.type || 'audio/webm';
  const sizeInMB = audioData.size / (1024 * 1024);
  
  console.log(`[transcribe-audio] Audio content type: ${contentType}, size: ${sizeInMB.toFixed(2)} MB`);
  
  // Check if the file is too large for OpenAI's API limit (currently 25MB)
  if (sizeInMB > 24) {
    throw new Error(`Audio file is too large (${sizeInMB.toFixed(2)} MB). Maximum allowed size is 24 MB.`);
  }
  
  // Determine if we need to convert based on MIME type
  // OpenAI accepts mp3, mp4, mpeg, mpga, m4a, wav, and webm
  const acceptedMimeTypes = [
    'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/mpga', 
    'audio/m4a', 'audio/wav', 'audio/webm'
  ];
  
  const isAcceptedType = acceptedMimeTypes.some(type => 
    contentType.includes(type.split('/')[1])
  );
  
  // If not an accepted type, set a generic audio/mp3 type
  const finalBlob = isAcceptedType 
    ? audioData 
    : new Blob([audioData], { type: 'audio/mp3' });

  console.log(`[transcribe-audio] Using ${isAcceptedType ? 'original' : 'converted'} blob with type: ${finalBlob.type}`);

  const formData = new FormData();
  formData.append('file', finalBlob, 'audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');
  // Add response_format parameter to ensure we get the most reliable format
  formData.append('response_format', 'json');

  return await withRetry(
    async () => {
      console.log('[transcribe-audio] Sending to OpenAI...');
      
      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
          body: formData,
        });

        console.log(`[transcribe-audio] OpenAI response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: { message: errorText } };
          }
          
          const errorMsg = errorData.error?.message || response.statusText;
          console.error(`[transcribe-audio] OpenAI API error: ${errorMsg}, status: ${response.status}`);
          console.error(`[transcribe-audio] Full error response: ${errorText}`);
          
          throw new Error(`OpenAI API error: ${errorMsg}`);
        }

        const result = await response.json();
        
        if (!result.text) {
          console.error('[transcribe-audio] No transcription text received from OpenAI');
          throw new Error('No transcription text received from OpenAI');
        }

        console.log('[transcribe-audio] Transcription successful, text length:', result.text.length);
        return result;
      } catch (error) {
        console.error('[transcribe-audio] Error during OpenAI API call:', error);
        throw error;
      }
    },
    {
      maxAttempts: 5,
      baseDelay: 5000,
      shouldRetry: (error) => {
        const errorMessage = error.message.toLowerCase();
        console.log(`[transcribe-audio] Checking if error is retryable: "${errorMessage}"`);
        
        const retryableErrors = [
          'rate limit',
          'timeout',
          'network error',
          'server error',
          'internal server error',
          '500',
          '502',
          '503',
          '504'
        ];
        
        const isRetryable = retryableErrors.some(msg => errorMessage.includes(msg));
        console.log(`[transcribe-audio] Error is ${isRetryable ? '' : 'not '}retryable`);
        return isRetryable;
      }
    }
  );
}
