
import { withRetry } from './retryUtils.ts';

export async function downloadAudioFile(supabase: any, filePath: string): Promise<Blob> {
  return withRetry(
    async () => {
      console.log('[storageClient] Attempting to download file:', filePath);
      
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (error) {
        console.error('[storageClient] Download error:', error);
        throw new Error(`Storage download failed: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data received from storage');
      }
      
      console.log('[storageClient] File downloaded successfully');
      return data;
    },
    {
      maxAttempts: 12,
      baseDelay: 5000,
      shouldRetry: (error) => {
        console.error('[storageClient] Error during download:', error);
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
