
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";

interface TranscriptionStatusProps {
  status: string;
  progress: number;
}

export const TranscriptionStatus = ({
  status,
  progress,
}: TranscriptionStatusProps) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'processing':
        return {
          message: "Processing audio",
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          color: "text-blue-600"
        };
      case 'transcribing':
        return {
          message: "Transcribing audio",
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          color: "text-blue-600"
        };
      case 'generating_minutes':
        return {
          message: "Generating meeting minutes",
          icon: <FileText className="h-5 w-5 text-blue-600" />,
          color: "text-blue-600"
        };
      case 'completed':
        return {
          message: "Processing completed",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          color: "text-green-600"
        };
      case 'error':
        return {
          message: "Processing error",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          color: "text-red-600"
        };
      default:
        return {
          message: "Waiting for processing",
          icon: <Loader2 className="h-5 w-5 animate-spin text-gray-600" />,
          color: "text-gray-600"
        };
    }
  };

  const { message, icon, color } = getStatusInfo();

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`font-medium ${color}`}>{message}</span>
        </div>
        {status !== 'completed' && status !== 'error' && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      
      {status !== 'completed' && status !== 'error' && progress > 0 && (
        <Progress value={progress} className="w-full" />
      )}
    </Card>
  );
};
