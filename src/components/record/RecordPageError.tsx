
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RecordPageErrorProps {
  errorMessage: string;
}

export function RecordPageError({ errorMessage }: RecordPageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Alert variant="destructive" className="w-full max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          A critical error occurred while loading the recorder: {errorMessage}
        </AlertDescription>
      </Alert>
    </div>
  );
}
