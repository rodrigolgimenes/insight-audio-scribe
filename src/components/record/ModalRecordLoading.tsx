
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ModalRecordLoadingProps {
  loadingProgress: number;
  message?: string;
}

export function ModalRecordLoading({ 
  loadingProgress, 
  message = "Initializing audio components..." 
}: ModalRecordLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h2 className="text-xl font-semibold mb-4">Loading Recording Components</h2>
      <Progress value={loadingProgress} className="w-full max-w-md mb-4" />
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
