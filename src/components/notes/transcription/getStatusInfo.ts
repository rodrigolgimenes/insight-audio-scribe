
import { StatusInfo } from "@/types/notes";

export const getStatusInfo = (status: string): StatusInfo => {
  switch (status) {
    case "pending":
      return {
        icon: "ClockIcon",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        message: "Waiting to process",
      };
    case "processing":
      return {
        icon: "LoaderIcon",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        message: "Processing audio",
      };
    case "transcribing":
      return {
        icon: "FileIcon",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        message: "Transcribing",
      };
    case "generating_minutes":
      return {
        icon: "FileTextIcon",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        message: "Generating minutes",
      };
    case "completed":
      return {
        icon: "CheckCircleIcon",
        color: "text-green-600",
        bgColor: "bg-green-50", 
        borderColor: "border-green-200",
        message: "Completed",
      };
    case "error":
      return {
        icon: "AlertCircleIcon",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        message: "Processing error",
      };
    default:
      return {
        icon: "InfoIcon",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        message: "Unknown status",
      };
  }
};
