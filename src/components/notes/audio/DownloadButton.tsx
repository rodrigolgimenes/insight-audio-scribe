
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
    if (!publicUrl) return;
    
    try {
      // Extract the filename from the path
      const pathParts = publicUrl.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      if (!filename) {
        throw new Error('Invalid audio URL format: No filename found');
      }

      console.log('[DownloadButton] Using filename for signed URL:', filename);
      
      // Generate a signed URL that expires in 1 hour
      const { data: { signedUrl }, error: signError } = await supabase
        .storage
        .from('audio_recordings')
        .createSignedUrl(filename, 3600);

      if (signError || !signedUrl) {
        throw new Error('Failed to generate download URL');
      }

      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error('Failed to fetch audio file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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
