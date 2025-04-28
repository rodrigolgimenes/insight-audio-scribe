
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFileUploadHandler } from './useFileUploadHandler';
import { toast as sonnerToast } from 'sonner';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { processFileUpload } = useFileUploadHandler(setIsUploading, toast);

  const handleFileUpload = async (
    e?: React.ChangeEvent<HTMLInputElement>,
    initiateTranscription = true,
    providedFile?: File
  ): Promise<{ noteId: string, recordingId: string }> => {
    let file: File | null = null;
    // Check if we're skipping device check
    const skipDeviceCheck = e?.target?.getAttribute('data-skip-device-check') === 'true' || false;

    try {
      // Get file from input or provided file
      if (providedFile) {
        file = providedFile;
      } else if (e?.target.files && e.target.files.length > 0) {
        file = e.target.files[0];
      }

      if (!file) {
        throw new Error('No file was selected');
      }

      setIsUploading(true);
      
      // Show a toast notification for larger files
      const fileSizeMB = Math.round(file.size / 1024 / 1024 * 10) / 10;
      if (fileSizeMB > 10) {
        sonnerToast.info(`Large file detected (${fileSizeMB} MB)`, {
          description: "Processing may take longer for large files."
        });
      }

      console.log(`[useFileUpload] Processing upload with skipDeviceCheck: ${skipDeviceCheck}`);
      const result = await processFileUpload(file, initiateTranscription, skipDeviceCheck);
      
      if (!result) {
        throw new Error('File upload processed but no result returned');
      }
      
      return result;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
      if (e?.target) {
        // Reset the file input
        e.target.value = '';
      }
    }
  };

  return {
    isUploading,
    handleFileUpload
  };
};
