
import React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { ErrorHelpers } from "./ErrorHelpers";

interface TranscriptionAlertProps {
  type: "warning" | "error";
  title: string;
  message: string;
  noteId?: string;
}

export const TranscriptionAlert: React.FC<TranscriptionAlertProps> = ({
  type,
  title,
  message,
  noteId
}) => {
  const isWarning = type === "warning";
  const bgColor = isWarning ? "bg-amber-50" : "bg-red-50";
  const borderColor = isWarning ? "border-amber-200" : "border-red-200";
  const textColor = isWarning ? "text-amber-700" : "text-red-700";
  const Icon = isWarning ? AlertTriangle : AlertCircle;
  const iconColor = isWarning ? "text-amber-500" : "text-red-500";

  return (
    <div className={`mt-2 mb-3 p-2 ${bgColor} border ${borderColor} rounded-md flex items-start gap-2`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div>
        <p className={`${textColor} font-medium`}>{title}</p>
        <p className={`text-sm ${isWarning ? "text-amber-600" : "text-red-600"}`}>{message}</p>
        
        {type === "error" && noteId && (
          <ErrorHelpers error={message} />
        )}
      </div>
    </div>
  );
};
