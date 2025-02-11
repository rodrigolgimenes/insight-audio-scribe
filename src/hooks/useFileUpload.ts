
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getMediaDuration } from "@/utils/mediaUtils";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldNavigate) {
      navigate("/app");
      setShouldNavigate(false);
    }
  }, [shouldNavigate, navigate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Unsupported file format. Please use audio files (MP3, WAV, WebM) or video files (MP4).",
        variant: "destructive",
      });
      return;
    }

    // Set loading states immediately after file validation
    setIsUploading(true);
    setIsProcessing(true);

    try {
      console.log('Getting media duration...');
      const durationInMs = await getMediaDuration(file);
      console.log('Media duration in milliseconds:', durationInMs);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating initial recording entry...');
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title: file.name || `Recording ${new Date().toLocaleString()}`,
          file_path: 'pending',
          status: 'pending',
          duration: durationInMs
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Error creating record: ${dbError.message}`);
      }
      console.log('Recording entry created:', recordingData);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordingId', recordingData.id);
      formData.append('duration', durationInMs.toString());

      console.log('Invoking transcribe-upload function...');
      const { data, error: functionError } = await supabase.functions.invoke('transcribe-upload', {
        body: formData,
      });

      if (functionError) {
        throw new Error(`Error processing file: ${functionError.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to process file');
      }

      console.log('File processed successfully');
      toast({
        title: "Success",
        description: "File processed successfully!",
      });

      setShouldNavigate(true);

    } catch (error) {
      console.error('Error uploading file:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Error processing file: ${error.message}` 
          : "Error processing file. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset states
      setIsUploading(false);
      setIsProcessing(false);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return {
    isUploading,
    isProcessing,
    handleFileUpload
  };
};
