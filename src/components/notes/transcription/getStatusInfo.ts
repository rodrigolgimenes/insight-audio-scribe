
import { Loader2, AudioLines, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

type StatusType = 'processing' | 'transcribing' | 'generating_minutes' | 'completed' | 'error' | string;

export interface StatusInfo {
  message: string;
  icon: ReactNode;
  color: string;
  details: string;
}

export const getStatusInfo = (status: StatusType, isLongAudio: boolean = false, durationInMinutes?: number): StatusInfo => {
  switch (status) {
    case 'processing':
      return {
        message: "Processing audio",
        icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
        color: "text-blue-600",
        details: isLongAudio ? 
          `This is a long recording (${durationInMinutes} minutes). Processing may take longer than usual.` : 
          "Preparing your audio file for transcription"
      };
    case 'transcribing':
      return {
        message: "Transcribing audio",
        icon: <AudioLines className="h-5 w-5 animate-pulse text-blue-600" />,
        color: "text-blue-600",
        details: isLongAudio ? 
          `Transcribing a ${durationInMinutes}-minute recording. This may take some time.` : 
          "Converting speech to text"
      };
    case 'generating_minutes':
      return {
        message: "Generating meeting minutes",
        icon: <FileText className="h-5 w-5 text-blue-600" />,
        color: "text-blue-600",
        details: "Creating structured notes from your transcription"
      };
    case 'completed':
      return {
        message: "Processing completed",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        color: "text-green-600",
        details: "Your recording has been successfully processed"
      };
    case 'error':
      return {
        message: "Processing error",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        color: "text-red-600",
        details: "An error occurred during processing"
      };
    default:
      return {
        message: "Waiting for processing",
        icon: <Loader2 className="h-5 w-5 animate-spin text-gray-600" />,
        color: "text-gray-600",
        details: "Your recording is in the queue for processing"
      };
  }
};
