
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BasicAudioRecorder } from "@/components/record/BasicAudioRecorder";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function SimpleRecord() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleRecordingSaved = (noteId: string) => {
    navigate("/app");
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

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Record Audio</h3>
          <BasicAudioRecorder 
            disabled={isDisabled}
            onRecordingSaved={handleRecordingSaved}
          />
        </CardContent>
      </Card>
    </div>
  );
}
