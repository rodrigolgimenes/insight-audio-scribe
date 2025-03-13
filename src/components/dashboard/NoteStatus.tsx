
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface NoteStatusProps {
  status: string;
  progress?: number;
  noteId?: string;
}

export const NoteStatus = ({ status, progress = 0, noteId }: NoteStatusProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'processing':
      case 'transcribing':
      case 'generating_minutes':
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'error':
        return 'Error';
      case 'pending':
        return 'Pending';
      case 'transcribing':
        return 'Transcribing';
      case 'generating_minutes':
        return 'Generating Minutes';
      case 'processing':
      default:
        return 'Processing';
    }
  };

  const getTooltipContent = () => {
    return (
      <div className="w-64">
        <div className="text-sm font-semibold mb-2">{getStatusText()}</div>
        
        {(status === 'processing' || status === 'transcribing' || status === 'generating_minutes' || status === 'pending') && (
          <>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-xs">{Math.round(progress)}% complete</p>
            
            {progress < 5 && (
              <p className="text-xs mt-1 text-gray-400">Starting up...</p>
            )}
            
            {progress >= 5 && progress < 50 && (
              <p className="text-xs mt-1 text-gray-400">This may take a few minutes for longer recordings</p>
            )}
            
            {progress >= 50 && progress < 90 && (
              <p className="text-xs mt-1 text-gray-400">Almost there...</p>
            )}
            
            {progress >= 90 && (
              <p className="text-xs mt-1 text-gray-400">Finishing up...</p>
            )}
          </>
        )}
        
        {status === 'error' && (
          <p className="text-xs text-red-500">
            There was an error processing this recording. Click to view details.
          </p>
        )}
        
        {status === 'completed' && (
          <p className="text-xs text-green-600">
            This recording has been fully processed and is ready to view.
          </p>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
            {['processing', 'transcribing', 'generating_minutes', 'pending'].includes(status) && progress > 0 && (
              <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
