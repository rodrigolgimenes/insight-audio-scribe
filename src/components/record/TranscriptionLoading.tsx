
import { Loader2 } from "lucide-react";

interface TranscriptionLoadingProps {
  isUploading?: boolean;
  isProcessing?: boolean;
}

export const TranscriptionLoading = ({ isUploading, isProcessing }: TranscriptionLoadingProps) => {
  const getMessage = () => {
    if (isUploading) {
      return "Uploading file...";
    }
    if (isProcessing) {
      return "Processing file...";
    }
    return "Transcribing note...";
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="flex items-center gap-2 text-xl font-semibold text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{getMessage()}</span>
        </div>
        <p className="text-gray-500">This may take a few minutes</p>
      </div>
    </div>
  );
};
