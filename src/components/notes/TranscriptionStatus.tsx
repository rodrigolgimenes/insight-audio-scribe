
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, AudioLines, FileText, CheckCircle2, AlertCircle, FileWarning, RefreshCcw, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";

interface TranscriptionStatusProps {
  status: string;
  progress: number;
  error?: string;
  duration?: number;
  noteId?: string;
}

export const TranscriptionStatus = ({
  status,
  progress,
  error,
  duration,
  noteId
}: TranscriptionStatusProps) => {
  const { retryTranscription } = useNoteTranscription();
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  const isLongAudio = durationInMinutes && durationInMinutes > 20;
  
  const getStatusInfo = () => {
    switch (status) {
      case 'processing':
        return {
          message: "Processing audio",
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          color: "text-blue-600",
          details: isLongAudio ? 
            `This is a long recording (${durationInMinutes} minutes). Processing may take longer than usual.` : 
            "Preparing your audio file for transcription"
        };
      case 'transcribing':
        return {
          message: "Transcribing audio",
          icon: <AudioLines className="h-5 w-5 animate-pulse text-blue-600" />,
          color: "text-blue-600",
          details: isLongAudio ? 
            `Transcribing a ${durationInMinutes}-minute recording. This may take some time.` : 
            "Converting speech to text"
        };
      case 'generating_minutes':
        return {
          message: "Generating meeting minutes",
          icon: <FileText className="h-5 w-5 text-blue-600" />,
          color: "text-blue-600",
          details: "Creating structured notes from your transcription"
        };
      case 'completed':
        return {
          message: "Processing completed",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          color: "text-green-600",
          details: "Your recording has been successfully processed"
        };
      case 'error':
        return {
          message: "Processing error",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          color: "text-red-600",
          details: error || "An error occurred during processing"
        };
      default:
        return {
          message: "Waiting for processing",
          icon: <Loader2 className="h-5 w-5 animate-spin text-gray-600" />,
          color: "text-gray-600",
          details: "Your recording is in the queue for processing"
        };
    }
  };

  const { message, icon, color, details } = getStatusInfo();
  
  const handleRetry = async () => {
    if (noteId) {
      const success = await retryTranscription(noteId);
      console.log('Retry transcription result:', success);
    }
  };

  const showRetryButton = status === 'error' && noteId;
  
  // Determine specific error type for more targeted help
  const isAudioFormatError = error?.toLowerCase().includes('formato') || 
                           error?.toLowerCase().includes('format');
  const isFileNotFoundError = error?.toLowerCase().includes('not found') || 
                            error?.toLowerCase().includes('não encontrado');
  const isFileSizeError = error?.toLowerCase().includes('too large') || 
                        error?.toLowerCase().includes('size limit') ||
                        error?.toLowerCase().includes('muito grande');
  const isTimeoutError = error?.toLowerCase().includes('timeout') || 
                      error?.toLowerCase().includes('timed out');

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`font-medium ${color}`}>{message}</span>
          
          {isLongAudio && status !== 'completed' && status !== 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                    <FileWarning className="h-3 w-3 mr-1" />
                    Long recording
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    This is a long recording ({durationInMinutes} minutes). 
                    Processing may take considerably longer than usual.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {status !== 'completed' && status !== 'error' && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
        
        {status === 'error' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4">
                <p className="font-medium mb-2">Common Error Solutions:</p>
                <ul className="list-disc ml-4 space-y-1 text-sm">
                  <li>Try using a different browser (Chrome recommended)</li>
                  <li>Convert your audio to MP3 format before uploading</li>
                  <li>Make sure your audio file is not corrupted</li>
                  <li>Ensure your recording is less than 25MB in size</li>
                  <li>Check your internet connection and try again</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {details && (
        <p className="text-sm text-gray-600 mt-1">{details}</p>
      )}
      
      {status === 'error' && error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
          
          {isAudioFormatError && (
            <div className="mt-2 text-xs">
              <p className="font-medium">Dicas para resolver:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Tente converter o arquivo para MP3 antes de fazer o upload</li>
                <li>Verifique se o arquivo de áudio não está corrompido</li>
                <li>Tente usar um navegador diferente (Chrome, Firefox, ou Edge)</li>
              </ul>
            </div>
          )}
          
          {isFileNotFoundError && (
            <div className="mt-2 text-xs">
              <p className="font-medium">Dicas para resolver:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>O arquivo pode ter sido excluído ou não foi carregado corretamente</li>
                <li>Tente fazer o upload novamente de um novo arquivo</li>
                <li>Verifique se você tem uma conexão estável com a internet</li>
              </ul>
            </div>
          )}
          
          {isFileSizeError && (
            <div className="mt-2 text-xs">
              <p className="font-medium">Dicas para resolver:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Seu arquivo é muito grande (o limite é de 25MB)</li>
                <li>Tente dividir a gravação em partes menores</li>
                <li>Comprima o arquivo para reduzir seu tamanho</li>
              </ul>
            </div>
          )}
          
          {isTimeoutError && (
            <div className="mt-2 text-xs">
              <p className="font-medium">Dicas para resolver:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>O processamento demorou muito tempo e atingiu o limite</li>
                <li>Tente com uma gravação mais curta</li>
                <li>Verifique se você tem uma conexão estável com a internet</li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      {showRetryButton && (
        <Button
          variant="outline"
          className="mt-3 bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
          onClick={handleRetry}
          size="sm"
        >
          <RefreshCcw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      )}
      
      {status !== 'completed' && status !== 'error' && progress > 0 && (
        <Progress value={progress} className="w-full mt-2" />
      )}
    </Card>
  );
};
