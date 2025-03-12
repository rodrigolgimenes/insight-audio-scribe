
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface RecordHeaderProps {
  onBack?: () => void;
  isRecording?: boolean;
  isPaused?: boolean;
}

export const RecordHeader = ({ onBack, isRecording, isPaused }: RecordHeaderProps) => {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          )}
          
          {isRecording !== undefined && (
            <div className="ml-auto text-sm font-medium">
              {isRecording ? 
                (isPaused ? 
                  <span className="text-amber-500">Recording Paused</span> : 
                  <span className="text-red-500">Recording</span>
                ) : 
                <span className="text-gray-500">Ready to record</span>
              }
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
