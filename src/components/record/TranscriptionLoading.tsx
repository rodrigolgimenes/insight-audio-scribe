
import { Loader2, AudioLines } from "lucide-react";

export const TranscriptionLoading = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="flex items-center gap-2 text-xl font-semibold text-primary justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Transcribing note...</span>
        </div>
        <p className="text-gray-500">
          Please wait while we process your note. This may take a few minutes, don't close this window.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div className="bg-[#2563EB] h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
        </div>
      </div>
    </div>
  );
};
