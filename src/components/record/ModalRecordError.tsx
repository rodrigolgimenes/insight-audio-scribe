
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ModalRecordErrorProps {
  errorMessage: string;
}

export function ModalRecordError({ errorMessage }: ModalRecordErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        A critical error occurred while loading the recorder: {errorMessage}
      </AlertDescription>
    </Alert>
  );
}
