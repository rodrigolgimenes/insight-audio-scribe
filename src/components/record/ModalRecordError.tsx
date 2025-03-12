
import React from "react";
import { DialogContent } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ModalRecordErrorProps {
  errorMessage: string;
  details?: string;
}

export function ModalRecordError({ errorMessage, details }: ModalRecordErrorProps) {
  return (
    <DialogContent>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">{errorMessage}</div>
          {details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer">Technical details</summary>
              <div className="mt-1 text-xs opacity-80 whitespace-pre-wrap">
                {details}
              </div>
            </details>
          )}
        </AlertDescription>
      </Alert>
    </DialogContent>
  );
}
