
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ModalRecordErrorProps {
  errorMessage: string;
  details?: string;
}

export function ModalRecordError({ errorMessage, details }: ModalRecordErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Recording Error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-sm font-medium">{errorMessage}</div>
        {details && (
          <div className="mt-2 text-xs opacity-80 max-h-24 overflow-y-auto">
            <code className="block whitespace-pre-wrap bg-background/50 p-2 rounded">{details}</code>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
