
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DownloadButtonProps {
  publicUrl: string | null;
  isAudioReady: boolean;
}

export const DownloadButton = ({ publicUrl, isAudioReady }: DownloadButtonProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!publicUrl) {
      console.error('[DownloadButton] No publicUrl provided');
      return;
    }
    
    try {
      console.log('[DownloadButton] Starting download for URL:', publicUrl);
      
      const filename = publicUrl.includes('/') 
        ? publicUrl.split('/').pop() 
        : publicUrl;
      
      if (!filename) {
        throw new Error('Invalid audio URL format');
      }

      console.log('[DownloadButton] Using filename:', filename);
      
      // Generate a signed URL that expires in 1 hour
      const { data, error: signError } = await supabase
        .storage
        .from('audio_recordings')
        .createSignedUrl(filename, 3600);

      if (signError || !data?.signedUrl) {
        console.error('[DownloadButton] Error generating signed URL:', signError);
        throw new Error('Failed to generate download URL');
      }

      console.log('[DownloadButton] Generated signed URL:', data.signedUrl);

      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        console.error('[DownloadButton] Error fetching audio:', response.statusText);
        throw new Error('Failed to fetch audio file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[DownloadButton] Download completed successfully');
      toast({
        title: "Success",
        description: "Audio file downloaded successfully",
      });
    } catch (error) {
      console.error('[DownloadButton] Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download audio file",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleDownload}
      disabled={!isAudioReady}
      className="text-primary hover:bg-primary/10"
    >
      <Download className="h-4 w-4 mr-2" />
      Download
    </Button>
  );
};
