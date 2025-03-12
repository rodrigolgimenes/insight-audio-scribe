
import { Progress } from "@/components/ui/progress";

interface RecordPageLoadingProps {
  loadingProgress: number;
  message?: string;
}

export function RecordPageLoading({ 
  loadingProgress, 
  message = "Initializing audio components..." 
}: RecordPageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center">Loading Audio Recorder</h2>
        <Progress value={loadingProgress} className="w-full" />
        <p className="text-center text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}
