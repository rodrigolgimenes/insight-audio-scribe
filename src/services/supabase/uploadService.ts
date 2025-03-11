
import { supabase } from "@/integrations/supabase/client";
import { UploadProgressTracker } from "@/utils/upload/uploadProgress";

export const uploadFileToSupabase = async (
  fileName: string, 
  file: File
): Promise<{ error?: Error }> => {
  // Configure chunked upload for large files
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const totalBytes = file.size;
  
  // Start progress tracking for large files
  let progressTracker: UploadProgressTracker | null = null;
  if (totalBytes > 25 * 1024 * 1024) {
    console.log(`Starting chunked upload for large file (${(totalBytes / (1024 * 1024)).toFixed(2)}MB)`);
    progressTracker = new UploadProgressTracker(totalBytes);
    progressTracker.startTracking(chunkSize);
  }

  try {
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('audio_recordings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    // Stop tracking progress
    if (progressTracker) {
      progressTracker.stopTracking();
    }

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message.includes('exceeded the maximum allowed size')) {
        return { 
          error: new Error(`Failed to upload file: The file exceeds the maximum allowed size (100MB).`) 
        };
      } else {
        return { 
          error: new Error(`Failed to upload file: ${uploadError.message}`) 
        };
      }
    }

    console.log('File uploaded successfully');
    return {};
  } catch (error) {
    // Stop tracking progress
    if (progressTracker) {
      progressTracker.stopTracking();
    }
    
    console.error('Unexpected upload error:', error);
    return { 
      error: error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred during file upload') 
    };
  }
};
