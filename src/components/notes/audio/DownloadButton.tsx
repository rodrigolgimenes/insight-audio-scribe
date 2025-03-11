
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DownloadButtonProps {
  publicUrl: string | null;
  isAudioReady: boolean;
  onRetryLoad?: () => void;
}

export const DownloadButton = ({ publicUrl, isAudioReady, onRetryLoad }: DownloadButtonProps) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleDownload = async () => {
    if (!publicUrl) {
      console.error('[DownloadButton] No publicUrl provided');
      setHasError(true);
      toast({
        title: "Error",
        description: "No audio URL provided. Try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloading(true);
    setHasError(false);
    
    try {
      console.log('[DownloadButton] Starting download for URL:', publicUrl);
      
      let cleanPath = publicUrl;
      
      // If it's a complete URL, extract the path
      if (cleanPath.includes('audio_recordings/')) {
        const parts = cleanPath.split('audio_recordings/');
        if (parts.length > 1) {
          cleanPath = parts[1];
        } else {
          throw new Error('Invalid audio URL format');
        }
      }
      
      // If it has URL parameters, remove them
      cleanPath = cleanPath.split('?')[0];
      
      console.log('[DownloadButton] Clean path:', cleanPath);

      // First verify the file exists
      const pathParts = cleanPath.split('/');
      const bucketFolder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const fileName = pathParts[pathParts.length - 1];
      
      const { data: fileList, error: listError } = await supabase
        .storage
        .from('audio_recordings')
        .list(bucketFolder, {
          limit: 100,
          search: fileName
        });

      if (listError) {
        console.error('[DownloadButton] Error listing files:', listError);
        throw new Error(`Failed to check file existence: ${listError.message}`);
      }

      const fileExists = fileList?.some(file => file.name === fileName);
      
      if (!fileExists) {
        throw new Error(`File not found in storage: ${cleanPath}`);
      }

      // Get signed URL
      const { data: signedData, error: signError } = await supabase
        .storage
        .from('audio_recordings')
        .createSignedUrl(cleanPath, 3600);

      if (signError || !signedData?.signedUrl) {
        console.error('[DownloadButton] Error generating signed URL:', signError);
        throw new Error('Failed to generate download URL');
      }

      const response = await fetch(signedData.signedUrl);
      if (!response.ok) {
        console.error('[DownloadButton] Error fetching audio:', response.statusText);
        throw new Error('Failed to fetch audio file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.split('.')[0] + '.mp3';
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[DownloadButton] Download completed successfully');
      toast({
        title: "Success",
        description: "Audio file downloaded successfully",
      });
      setHasError(false);
    } catch (error) {
      console.error('[DownloadButton] Error downloading file:', error);
      setHasError(true);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download audio file",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = () => {
    if (onRetryLoad) {
      setHasError(false);
      onRetryLoad();
    }
  };

  if (hasError && onRetryLoad) {
    return (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleRetry}
        className="text-blue-500 hover:bg-blue-50"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry Loading
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleDownload}
      disabled={!isAudioReady || isDownloading}
      className="text-primary hover:bg-primary/10"
    >
      {isDownloading ? (
        <>
          <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download
        </>
      )}
    </Button>
  );
};
