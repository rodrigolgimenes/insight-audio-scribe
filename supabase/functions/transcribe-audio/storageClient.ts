
import { withRetry } from './retryUtils.ts';

export async function downloadAudioFile(supabase: any, filePath: string): Promise<Blob> {
  console.log(`[transcribe-audio] Starting download of file: ${filePath}`);
  
  // Decode URL components if present in the filename
  let decodedPath = filePath;
  try {
    if (filePath.includes('%')) {
      decodedPath = decodeURIComponent(filePath);
      console.log(`[transcribe-audio] Decoded file path: ${decodedPath}`);
    }
  } catch (e) {
    console.error(`[transcribe-audio] Error decoding file path, using original: ${e.message}`);
  }
  
  // Extract path parts for listing
  const pathParts = decodedPath.split('/');
  const userId = pathParts[0]; // First part should be user ID
  const fileName = pathParts[pathParts.length - 1];
  const bucketFolder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
  
  console.log(`[transcribe-audio] Checking for file with parameters:`, { 
    bucketFolder, 
    fileName,
    userId 
  });
  
  // First try to list files in the user's folder
  const { data: folderFiles, error: folderError } = await supabase
    .storage
    .from('audio_recordings')
    .list(bucketFolder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    
  if (folderError) {
    console.error('[transcribe-audio] Error listing folder:', folderError);
    
    // Try directly with user ID as fallback
    const { data: userFiles, error: userError } = await supabase
      .storage
      .from('audio_recordings')
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      
    if (userError || !userFiles || !userFiles.length) {
      console.error('[transcribe-audio] Error listing user files:', userError);
      throw new Error(`Error checking file existence: ${folderError.message}`);
    }
    
    console.log(`[transcribe-audio] Found ${userFiles.length} files in user folder`);
    
    // Try to find a file with a similar name (partial match)
    const fileNameWithoutExtension = fileName.split('.')[0].split('_')[0];
    const matchingFiles = userFiles.filter(
      (file: any) => file.name.includes(fileNameWithoutExtension)
    );
    
    if (!matchingFiles.length) {
      console.error(`[transcribe-audio] No matching files found for: ${fileNameWithoutExtension}`);
      throw new Error(`File not found in storage: ${filePath}`);
    }
    
    // Use the most recent matching file
    decodedPath = `${userId}/${matchingFiles[0].name}`;
    console.log(`[transcribe-audio] Using alternative file: ${decodedPath}`);
  } else {
    console.log(`[transcribe-audio] Found ${folderFiles?.length || 0} files in the folder`);
    
    // Try to find exact match first
    let fileExists = folderFiles?.some((file: any) => file.name === fileName);
    
    // If exact match not found, try partial match
    if (!fileExists && folderFiles?.length) {
      // Extract base part of filename without timestamps
      const baseFileName = fileName.split('_')[0];
      const similarFiles = folderFiles.filter((file: any) => 
        file.name.includes(baseFileName) || 
        (fileName.includes('.') && file.name.includes(fileName.split('.')[0]))
      );
      
      if (similarFiles.length) {
        // Sort by creation time to get the most recent
        similarFiles.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        decodedPath = `${bucketFolder}/${similarFiles[0].name}`;
        fileExists = true;
        console.log(`[transcribe-audio] No exact match, using similar file: ${similarFiles[0].name}`);
      }
    }
    
    if (!fileExists) {
      console.error(`[transcribe-audio] File not found in storage: ${filePath}`);
      throw new Error(`File not found in storage: ${filePath}`);
    }
  }
  
  return withRetry(
    async () => {
      console.log(`[transcribe-audio] Downloading file: ${decodedPath}`);
      
      const { data, error } = await supabase
        .storage
        .from('audio_recordings')
        .download(decodedPath);

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
      maxAttempts: 5,
      baseDelay: 2000,
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
