
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, AudioLines, FileText, CheckCircle2, AlertCircle, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TranscriptionStatusProps {
  status: string;
  progress: number;
  error?: string;
  duration?: number;
}

export const TranscriptionStatus = ({
  status,
  progress,
  error,
  duration
}: TranscriptionStatusProps) => {
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
      </div>
      
      {details && (
        <p className="text-sm text-gray-600 mt-1">{details}</p>
      )}
      
      {status === 'error' && error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
      
      {status !== 'completed' && status !== 'error' && progress > 0 && (
        <Progress value={progress} className="w-full mt-2" />
      )}
    </Card>
  );
};
