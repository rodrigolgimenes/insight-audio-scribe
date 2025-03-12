
import React from "react";
import { DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ModalRecordLoadingProps {
  loadingProgress: number;
  message: string;
}

export function ModalRecordLoading({ loadingProgress, message }: ModalRecordLoadingProps) {
  return (
    <DialogContent className="sm:max-w-[600px]">
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Progress value={loadingProgress} className="w-full" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </DialogContent>
  );
}
