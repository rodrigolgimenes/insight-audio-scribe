
import { withRetry } from './retryUtils.ts';

export async function downloadAudioFile(supabase: any, filePath: string): Promise<Blob> {
  return withRetry(
    async () => {
      console.log('[storageClient] Attempting to download file:', filePath);
      
      // First check if file exists
      const { data: existsData, error: existsError } = await supabase
        .storage
        .from('audio_recordings')
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 1,
          search: filePath.split('/').pop()
        });

      if (existsError) {
        console.error('[storageClient] Error checking file existence:', existsError);
        throw new Error(`Failed to check file existence: ${existsError.message}`);
      }

      if (!existsData || existsData.length === 0) {
        console.error('[storageClient] File not found in storage:', filePath);
        throw new Error('File not found in storage');
      }

      // Attempt to download file
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(filePath);

      if (error) {
        console.error('[storageClient] Download error:', error);
        const errorMessage = error.message || JSON.stringify(error);
        throw new Error(`Storage download failed: ${errorMessage}`);
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
        
        // Don't retry if file doesn't exist
        if (error.message.includes('File not found')) {
          return false;
        }

        const retryableErrors = [
          'network error',
          'timeout',
          'rate limit',
          'internal server error',
          'unknown error'
        ];
        
        const shouldRetry = retryableErrors.some(msg => 
          error.message.toLowerCase().includes(msg)
        );
        
        console.log('[storageClient] Should retry:', shouldRetry);
        return shouldRetry;
      }
    }
  );
}
