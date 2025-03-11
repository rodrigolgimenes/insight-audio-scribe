
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface NoteStatusProps {
  status: string;
  progress?: number;
}

export const NoteStatus = ({ status, progress = 0 }: NoteStatusProps) => {
  console.log("Rendering status:", status, "progress:", progress);
  const displayProgress = Math.round(progress);
  
  switch (status) {
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
          Error
        </span>
      );
    case "transcribing":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Transcribing {displayProgress}%
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Processing {displayProgress}%
        </span>
      );
  }
};
