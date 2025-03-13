
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface NoteStatusProps {
  status: string;
  progress?: number;
}

export const NoteStatus = ({ status, progress = 0 }: NoteStatusProps) => {
  // Ensure progress is always a number between 0-100
  const displayProgress = Math.max(0, Math.min(100, Math.round(progress)));
  
  console.log("Rendering status:", status, "normalized progress:", displayProgress);
  
  // Force completed status for edge cases where minutes are generated
  const forceCompleted = status === 'generating_minutes' && displayProgress >= 100;
  const displayStatus = forceCompleted ? 'completed' : status;
  
  // Check for edge function error in status
  const isEdgeFunctionError = displayStatus === 'error' && displayProgress === 0;
  
  switch (displayStatus) {
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Completed
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          {isEdgeFunctionError ? "Processing error" : "Error"}
        </span>
      );
    case "transcribing":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lavender-web text-palatinate-blue">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Transcribing {displayProgress}%
        </span>
      );
    case "generating_minutes":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lavender-web text-primary-dark">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Generating Minutes {displayProgress}%
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Pending {displayProgress > 0 ? `${displayProgress}%` : ''}
        </span>
      );
    case "processing":
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lavender-web text-palatinate-blue">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Processing {displayProgress}%
        </span>
      );
  }
};
