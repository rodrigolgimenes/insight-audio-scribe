
import { ProcessedContent } from "@/components/record/ProcessedContent";

interface ProcessedContentSectionProps {
  processedContent: { title: string; content: string } | null;
  transcript: string | null;
  processMutation: {
    isPending: boolean;
    mutate: (data: { transcript: string }) => void;
  };
}

export const ProcessedContentSection = ({
  processedContent,
  transcript,
  processMutation,
}: ProcessedContentSectionProps) => {
  if (!processedContent) return null;

  return (
    <ProcessedContent
      title={processedContent.title}
      content={processedContent.content}
      originalTranscript={transcript || ""}
      onReprocess={() => transcript && processMutation.mutate({ transcript })}
      isProcessing={processMutation.isPending}
    />
  );
};
