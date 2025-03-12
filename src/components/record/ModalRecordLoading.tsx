
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ModalRecordLoadingProps {
  loadingProgress: number;
  message?: string;
  isIndeterminate?: boolean;
}

export function ModalRecordLoading({ 
  loadingProgress, 
  message = "Initializing audio components...",
  isIndeterminate = false
}: ModalRecordLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h2 className="text-xl font-semibold text-[#4285F4] mb-4">Loading Recording Components</h2>
      
      {isIndeterminate ? (
        <div className="flex items-center justify-center w-full mb-4">
          <Loader2 className="h-8 w-8 text-[#4285F4] animate-spin" />
        </div>
      ) : (
        <Progress value={loadingProgress} className="w-full max-w-md mb-4 bg-[#E8F0FE]" />
      )}
      
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
