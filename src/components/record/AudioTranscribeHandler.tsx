
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFileUpload } from '@/hooks/upload/useFileUpload';
import { toast } from 'sonner';
import { UploadDialog } from './UploadDialog';

interface AudioTranscribeHandlerProps {
  audioBlob: Blob | null;
  duration: number;
  children: (handleTranscribe: () => void) => React.ReactNode;
}

export const AudioTranscribeHandler: React.FC<AudioTranscribeHandlerProps> = ({ 
  audioBlob, 
  duration,
  children 
}) => {
  const navigate = useNavigate();
  const { handleFileUpload } = useFileUpload();
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState<boolean>(false);

  const handleTranscribe = async () => {
    if (!audioBlob || duration < 1000) {
      toast.warning('Recording is too short', {
        description: 'Recording must be at least 1 second long.',
        duration: 3000
      });
      return;
    }

    try {
      setIsUploading(true);
      setIsUploadDialogOpen(true);

      // Create a File object from the blob
      const file = new File([audioBlob], 'recording.webm', {
        type: 'audio/webm',
        lastModified: Date.now()
      });

      // Upload the file
      const result = await handleFileUpload(undefined, true, file);
      
      if (result) {
        toast.success('Recording uploaded successfully');
        
        // Navigate to the note
        navigate(`/notes/${result.noteId}`);
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Transcription failed', {
        description: 'There was an error uploading your recording.',
        duration: 5000
      });
    } finally {
      setIsUploading(false);
      setIsUploadDialogOpen(false);
    }
  };

  return (
    <>
      {children(handleTranscribe)}
      <UploadDialog 
        isOpen={isUploadDialogOpen} 
        onOpenChange={setIsUploadDialogOpen} 
      />
    </>
  );
};
