
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { Loader2, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  
  // Debug for duration display
  console.log('NoteCardContent duration value:', {
    duration,
    durationType: typeof duration,
    formattedDuration: formatDuration(duration)
  });
  
  // Check if meeting minutes exist for this note (using transcript as a proxy for the note id)
  const { data: minutesExist } = useQuery({
    queryKey: ['meeting-minutes-exist', transcript],
    queryFn: async () => {
      // This is just a simple check to determine if we should override status
      // We don't have the note ID here, so we can't directly query
      return !!transcript;
    },
    // Don't actually make a query, just use the transcript presence as a boolean
    enabled: false,
    initialData: !!transcript
  });
  
  // Determine effective status based on all information
  let effectiveStatus = status;
  
  // If transcript exists but status is not completed, consider it completed
  if (transcript && status !== 'completed' && status !== 'error') {
    effectiveStatus = 'completed';
  }
  
  // If progress is 100% and status is still processing/generating, consider it completed
  if (displayProgress >= 100 && (status === 'generating_minutes' || status === 'processing')) {
    effectiveStatus = 'completed';
  }
  
  // Determine estimated time based on progress
  const getEstimatedTime = () => {
    if (effectiveStatus === 'pending' || effectiveStatus === 'processing') {
      if (displayProgress < 10) return 'Starting...';
      if (displayProgress < 30) return '~3-5 minutes';
      if (displayProgress < 50) return '~2-3 minutes';
      if (displayProgress < 70) return '~1-2 minutes';
      if (displayProgress < 90) return 'Almost done';
      return 'Finishing up...';
    }
    return '';
  };
  
  const getStatusDisplay = () => {
    // Force completed status if we have meeting minutes
    if (minutesExist && effectiveStatus !== 'error') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Ready</span>
        </div>
      );
    }
    
    // Check if we have a transcript but inconsistent status
    if (transcript && effectiveStatus !== 'completed' && effectiveStatus !== 'error') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Ready</span>
        </div>
      );
    }
    
    switch (effectiveStatus) {
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Transcribing... {displayProgress}%</span>
            </div>
            {displayProgress > 0 && displayProgress < 100 && (
              <div className="text-xs text-gray-500">{getEstimatedTime()}</div>
            )}
          </div>
        );
      case 'generating_minutes':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Minutes... {displayProgress}%</span>
            </div>
            {displayProgress > 0 && displayProgress < 100 && (
              <div className="text-xs text-gray-500">{getEstimatedTime()}</div>
            )}
          </div>
        );
      case 'pending':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-yellow-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Starting transcription{displayProgress > 0 ? ` ${displayProgress}%` : '...'}</span>
            </div>
            {displayProgress > 0 && (
              <div className="text-xs text-gray-500">{getEstimatedTime()}</div>
            )}
          </div>
        );
      case 'processing':
      default:
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing... {displayProgress}%</span>
            </div>
            {displayProgress > 0 && displayProgress < 100 && (
              <div className="text-xs text-gray-500">{getEstimatedTime()}</div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Status and Progress */}
      <div className="space-y-2">
        {getStatusDisplay()}
        {effectiveStatus !== 'completed' && effectiveStatus !== 'error' && (
          <Progress value={progress} className="h-2 bg-gray-200" />
        )}
      </div>

      {/* Content */}
      {transcript && (
        <p className="text-sm text-gray-600 line-clamp-3">{transcript}</p>
      )}
      {effectiveStatus === 'completed' && !transcript && (
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
