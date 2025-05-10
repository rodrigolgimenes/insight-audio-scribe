
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SimpleRecorder } from "@/components/record/SimpleRecorder";
import { FileUploadSection } from "@/components/record/FileUploadSection";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function SimpleRecord() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle successful recording save - ensure it returns a Promise
  const handleRecordingSaved = async (noteId: string) => {
    navigate("/app");
    return Promise.resolve();
  };

  const isDisabled = !session;
  
  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Simple Recorder</h1>

      {isDisabled && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to use this feature.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Record Audio</h3>
            <SimpleRecorder 
              disabled={isDisabled}
              onRecordingSaved={handleRecordingSaved}
              onError={(errorMsg) => setError(errorMsg)}
              onLoadingChange={setIsLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Already have a recording?</h3>
            <FileUploadSection 
              isDisabled={isLoading || !session}
              showDetailsPanel={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
