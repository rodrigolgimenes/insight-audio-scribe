
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { Loader2, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface NoteCardContentProps {
  transcript: string | null;
  duration: number | null;
  createdAt: string;
  folder?: { id: string; name: string } | null;
  status?: string;
  progress?: number;
  noteId?: string;
}

export const NoteCardContent = ({ 
  transcript, 
  duration, 
  createdAt, 
  folder,
  status = 'pending',
  progress = 0,
  noteId
}: NoteCardContentProps) => {
  // Ensure progress is a number and properly rounded
  const [realTimeProgress, setRealTimeProgress] = useState(progress);
  const [realTimeStatus, setRealTimeStatus] = useState(status);
  
  // Set up a realtime listener for this specific note's progress
  useEffect(() => {
    if (!noteId) return;
    
    // Set initial values
    setRealTimeProgress(progress);
    setRealTimeStatus(status);
    
    // Create subscription for real-time updates
    const channel = supabase
      .channel(`note-progress-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `id=eq.${noteId}`
        },
        (payload) => {
          if (payload.new) {
            if ('processing_progress' in payload.new) {
              setRealTimeProgress(payload.new.processing_progress || 0);
            }
            if ('status' in payload.new) {
              setRealTimeStatus(payload.new.status || 'pending');
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, progress, status]);
  
  // Fallback to props if we don't have realtime data
  const displayProgress = Math.round(realTimeProgress || progress || 0);
  const effectiveStatus = realTimeStatus || status;
  
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
  
  // If progress stalls for too long, periodically refresh
  useEffect(() => {
    if (!noteId || realTimeStatus === 'completed' || realTimeStatus === 'error') return;
    
    // Periodically refresh the status for this note
    const refreshInterval = setInterval(async () => {
      if (realTimeStatus === 'pending' && realTimeProgress < 10) {
        try {
          // Check the current status
          const { data } = await supabase
            .from('notes')
            .select('status, processing_progress')
            .eq('id', noteId)
            .single();
            
          if (data) {
            setRealTimeStatus(data.status || 'pending');
            setRealTimeProgress(data.processing_progress || 0);
          }
        } catch (error) {
          console.error('Error refreshing note status:', error);
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [noteId, realTimeStatus, realTimeProgress]);
  
  // Determine effective status based on all information
  let displayStatus = effectiveStatus;
  
  // If transcript exists but status is not completed, consider it completed
  if (transcript && displayStatus !== 'completed' && displayStatus !== 'error') {
    displayStatus = 'completed';
  }
  
  // If progress is 100% and status is still processing/generating, consider it completed
  if (displayProgress >= 100 && (displayStatus === 'generating_minutes' || displayStatus === 'processing')) {
    displayStatus = 'completed';
  }
  
  // Determine estimated time based on progress
  const getEstimatedTime = () => {
    if (displayStatus === 'pending' || displayStatus === 'processing') {
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
    if (minutesExist && displayStatus !== 'error') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Ready</span>
        </div>
      );
    }
    
    // Check if we have a transcript but inconsistent status
    if (transcript && displayStatus !== 'completed' && displayStatus !== 'error') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Ready</span>
        </div>
      );
    }
    
    switch (displayStatus) {
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
        {displayStatus !== 'completed' && displayStatus !== 'error' && (
          <Progress value={displayProgress} className="h-2 bg-gray-200" />
        )}
      </div>

      {/* Content */}
      {transcript && (
        <p className="text-sm text-gray-600 line-clamp-3">{transcript}</p>
      )}
      {displayStatus === 'completed' && !transcript && (
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
