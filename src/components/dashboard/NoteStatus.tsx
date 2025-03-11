
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface NoteStatusProps {
  status: string;
}

export const NoteStatus = ({ status }: NoteStatusProps) => {
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
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          Processing
        </span>
      );
  }
};
