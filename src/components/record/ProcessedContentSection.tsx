
import { ProcessedContent } from "@/components/record/ProcessedContent";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioWaveform } from "lucide-react";

interface ProcessedContentSectionProps {
  audioUrl: string | null;
  isLoading: boolean;
  isRecording?: boolean;
  processedContent?: { title: string; content: string } | null;
  transcript?: string | null;
  processMutation?: {
    isPending: boolean;
    mutate: (data: { transcript: string }) => void;
  };
}

export const ProcessedContentSection = ({
  audioUrl,
  isLoading,
  isRecording = false,
  processedContent = null,
  transcript = null,
  processMutation,
}: ProcessedContentSectionProps) => {
  // When we have no audio URL and not recording, show nothing yet
  if (!audioUrl && !isRecording) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Processed Content</h2>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <AudioWaveform className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-center">Record or upload audio to see processed content here.</p>
        </div>
      </div>
    );
  }

  // When loading or recording is in progress
  if (isLoading || isRecording) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isRecording ? "Recording in Progress" : "Processing..."}
        </h2>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {isRecording ? 
            "Your recording will be processed after you stop and save it." : 
            "Your recording is being processed. This may take a few moments."
          }
        </div>
      </div>
    );
  }

  // If we have processed content, show it
  if (processedContent) {
    return (
      <ProcessedContent
        title={processedContent.title}
        content={processedContent.content}
        originalTranscript={transcript || ""}
        onReprocess={() => transcript && processMutation?.mutate({ transcript })}
        isProcessing={processMutation?.isPending || false}
      />
    );
  }

  // Default: audio exists but no processed content yet
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Ready for Processing</h2>
      <p className="text-gray-500 text-sm">Your recording is ready to be processed. Click the "Save & Transcribe" button to start transcription.</p>
      
      {audioUrl && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview Your Recording</h3>
          <audio 
            controls
            className="w-full"
            src={audioUrl}
          ></audio>
        </div>
      )}
    </div>
  );
};
