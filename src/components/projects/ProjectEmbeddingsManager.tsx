
import React from "react";
import { Button } from "@/components/ui/button";
import { useProjectEmbeddings } from "@/hooks/useProjectEmbeddings";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ProjectEmbeddingsManagerProps {
  projectId: string;
}

export function ProjectEmbeddingsManager({ projectId }: ProjectEmbeddingsManagerProps) {
  const { generateEmbeddings, isProcessing } = useProjectEmbeddings();

  const handleGenerateEmbeddings = async () => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    const result = await generateEmbeddings(projectId);
    
    if (result.success) {
      toast.success("Project embeddings generation initiated");
    } else {
      toast.error(`Failed to generate embeddings: ${result.message}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleGenerateEmbeddings}
        disabled={isProcessing || !projectId}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Update Embeddings
          </>
        )}
      </Button>
    </div>
  );
}
