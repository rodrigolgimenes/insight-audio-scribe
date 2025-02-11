
import { Loader2 } from "lucide-react";

export const TranscriptionLoading = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="flex items-center gap-2 text-xl font-semibold text-primary justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Uploading file...</span>
        </div>
        <p className="text-gray-500">
          Your file is being uploaded and processed. This may take a few minutes, please don't close this window.
        </p>
      </div>
    </div>
  );
};
