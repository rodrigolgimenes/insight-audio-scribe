
import { withRetry } from './retryUtils.ts';

export async function downloadAudioFile(supabase: any, filePath: string): Promise<Blob> {
  return withRetry(
    async () => {
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error('No data received from storage');
      
      return data;
    },
    {
      maxAttempts: 12,
      baseDelay: 5000,
      shouldRetry: (error) => {
        const retryableErrors = [
          'network error',
          'timeout',
          'rate limit',
          'internal server error'
        ];
        return retryableErrors.some(msg => error.message.toLowerCase().includes(msg));
      }
    }
  );
}
