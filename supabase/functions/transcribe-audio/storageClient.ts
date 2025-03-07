
import { withRetry } from './retryUtils.ts';

export async function downloadAudioFile(supabase: any, filePath: string): Promise<Blob> {
  return withRetry(
    async () => {
      console.log(`[transcribe-audio] Downloading file: ${filePath}`);
      
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (error) {
        console.error('[transcribe-audio] Download error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('[transcribe-audio] No data received from storage');
        throw new Error('No data received from storage');
      }
      
      console.log('[transcribe-audio] File downloaded successfully');
      return data;
    },
    {
      maxAttempts: 12,
      baseDelay: 5000,
      shouldRetry: (error) => {
        const errorMessage = error.message.toLowerCase();
        const retryableErrors = [
          'network error',
          'timeout',
          'rate limit',
          'internal server error',
          'econnreset',
          'socket hang up'
        ];
        
        const shouldRetry = retryableErrors.some(msg => errorMessage.includes(msg));
        console.log(`[transcribe-audio] Error "${errorMessage}" is retryable: ${shouldRetry}`);
        return shouldRetry;
      }
    }
  );
}
