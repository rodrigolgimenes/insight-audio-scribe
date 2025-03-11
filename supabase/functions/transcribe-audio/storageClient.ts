
import { withRetry } from './retryUtils.ts';

export async function downloadAudioFile(supabase: any, filePath: string): Promise<Blob> {
  console.log(`[transcribe-audio] Starting download of file: ${filePath}`);
  
  // First check if the file exists
  const { data: existsData, error: existsError } = await supabase
    .storage
    .from('audio_recordings')
    .list(filePath.split('/').slice(0, -1).join('/') || '');
    
  if (existsError) {
    console.error('[transcribe-audio] Error checking file existence:', existsError);
  } else {
    const fileName = filePath.split('/').pop();
    const fileExists = existsData.some((file: any) => file.name === fileName);
    console.log(`[transcribe-audio] File existence check: ${fileExists ? 'Found' : 'Not found'}`);
    
    if (!fileExists) {
      console.error(`[transcribe-audio] File not found in storage: ${filePath}`);
      throw new Error(`File not found in storage: ${filePath}`);
    }
  }
  
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
      
      console.log('[transcribe-audio] File downloaded successfully, size:', 
        `${(data.size / (1024 * 1024)).toFixed(2)} MB`);
      
      // Verify that the blob contains data
      if (data.size === 0) {
        console.error('[transcribe-audio] Downloaded file is empty (0 bytes)');
        throw new Error('Downloaded file is empty (0 bytes)');
      }
      
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
          'socket hang up',
          '500', 
          '502',
          '503',
          '504'
        ];
        
        const shouldRetry = retryableErrors.some(msg => errorMessage.includes(msg));
        console.log(`[transcribe-audio] Error "${errorMessage}" is retryable: ${shouldRetry}`);
        return shouldRetry;
      }
    }
  );
}
