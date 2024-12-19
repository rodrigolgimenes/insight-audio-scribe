import { ProcessedContent } from "@/components/record/ProcessedContent";

interface ProcessedContentSectionProps {
  processedContent: { title: string; content: string; styleId: string } | null;
  transcript: string | null;
  processMutation: {
    isPending: boolean;
    mutate: (data: { styleId: string; transcript: string }) => void;
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
      onReprocess={() => processedContent && transcript && processMutation.mutate({ 
        styleId: processedContent.styleId, 
        transcript 
      })}
      isProcessing={processMutation.isPending}
    />
  );
};