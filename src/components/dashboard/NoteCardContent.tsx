import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { Loader2, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface NoteCardContentProps {
  transcript: string | null;
  duration: number | null;
  createdAt: string;
  folder?: { id: string; name: string } | null;
  status?: string;
  progress?: number;
}

export const NoteCardContent = ({ 
  transcript, 
  duration, 
  createdAt, 
  folder,
  status = 'pending',
  progress = 0
}: NoteCardContentProps) => {
  // Ensure progress is a number and properly rounded
  const displayProgress = Math.round(progress || 0);
  
  // Depuração para verificar o valor da duração
  console.log('NoteCardContent duration value:', {
    duration,
    durationType: typeof duration,
    formattedDuration: formatDuration(duration)
  });
  
  const getStatusDisplay = () => {
    // Check if we have a transcript but inconsistent status
    if (transcript && status !== 'completed') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Ready</span>
        </div>
      );
    }
    
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Error processing note</span>
          </div>
        );
      case 'transcribing':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transcribing... {displayProgress}%</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Pending... {displayProgress > 0 ? `${displayProgress}%` : ''}</span>
          </div>
        );
      case 'processing':
      default:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing... {displayProgress}%</span>
          </div>
        );
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Status and Progress */}
      <div className="space-y-2">
        {getStatusDisplay()}
        {status !== 'completed' && status !== 'error' && (
          <Progress value={progress} className="h-2" />
        )}
      </div>

      {/* Content */}
      {transcript && (
        <p className="text-sm text-gray-600 line-clamp-3">{transcript}</p>
      )}
      {status === 'completed' && !transcript && (
        <p className="text-sm text-gray-500 italic">Transcript ready but not loaded. Click to view.</p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {formatDuration(duration)}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Folder */}
      {folder && (
        <div className="text-sm text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded-md">
            {folder.name}
          </span>
        </div>
      )}
    </div>
  );
};
