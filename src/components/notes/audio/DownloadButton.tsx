
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DownloadButtonProps {
  publicUrl: string | null;
  isAudioReady: boolean;
}

export const DownloadButton = ({ publicUrl, isAudioReady }: DownloadButtonProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!publicUrl) return;
    
    try {
      const response = await fetch(publicUrl);
      if (!response.ok) throw new Error('Failed to fetch audio file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const extension = publicUrl.split('.').pop()?.toLowerCase() || 'webm';
      a.download = `recording.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Audio file downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
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
