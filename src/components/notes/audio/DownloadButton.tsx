
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
      
      // Limpar o caminho do arquivo
      const cleanPath = publicUrl
        .replace(/^.*[\\\/]/, '') // Remove tudo antes da última barra
        .split('?')[0]; // Remove parâmetros de URL se houver
      
      console.log('[DownloadButton] Clean path:', cleanPath);

      if (!cleanPath) {
        throw new Error('Invalid audio URL format');
      }

      // Verificar se o arquivo existe
      const { data: listData, error: listError } = await supabase
        .storage
        .from('audio_recordings')
        .list('', {
          limit: 1,
          search: cleanPath
        });

      console.log('[DownloadButton] List result:', { listData, listError });

      if (listError) {
        console.error('[DownloadButton] Error listing files:', listError);
        throw new Error(`Failed to check file existence: ${listError.message}`);
      }

      if (!listData || listData.length === 0) {
        console.error('[DownloadButton] File not found in bucket');
        throw new Error('Audio file not found in storage');
      }

      // Gerar URL assinada para download
      const { data: signedData, error: signError } = await supabase
        .storage
        .from('audio_recordings')
        .createSignedUrl(cleanPath, 3600);

      console.log('[DownloadButton] Signed URL result:', { signedData, signError });

      if (signError || !signedData?.signedUrl) {
        console.error('[DownloadButton] Error generating signed URL:', signError);
        throw new Error('Failed to generate download URL');
      }

      // Fazer o download do arquivo
      const response = await fetch(signedData.signedUrl);
      if (!response.ok) {
        console.error('[DownloadButton] Error fetching audio:', response.statusText);
        throw new Error('Failed to fetch audio file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cleanPath;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[DownloadButton] Download completed successfully');
      toast({
        title: "Sucesso",
        description: "Arquivo de áudio baixado com sucesso",
      });
    } catch (error) {
      console.error('[DownloadButton] Error downloading file:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao baixar arquivo de áudio",
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
