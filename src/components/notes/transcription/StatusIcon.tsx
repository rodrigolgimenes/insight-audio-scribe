
import React from "react";
import { AlertCircle, CheckCircle, Clock, FileText, File, Info, Loader } from "lucide-react";

interface StatusIconProps {
  status: string;
  className?: string;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, className = "" }) => {
  switch (status) {
    case "pending":
      return <Clock className={`h-5 w-5 text-amber-600 ${className}`} />;
    case "processing":
      return <Loader className={`h-5 w-5 text-palatinate-blue animate-spin ${className}`} />;
    case "transcribing":
      return <File className={`h-5 w-5 text-palatinate-blue ${className}`} />;
    case "generating_minutes":
      return <FileText className={`h-5 w-5 text-primary-dark ${className}`} />;
    case "completed":
      return <CheckCircle className={`h-5 w-5 text-green-600 ${className}`} />;
    case "error":
      return <AlertCircle className={`h-5 w-5 text-red-600 ${className}`} />;
    default:
      return <Info className={`h-5 w-5 text-gray-600 ${className}`} />;
  }
};
