
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message: string;
}

export const LoadingSpinner = ({ message }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="ml-2 text-gray-600">{message}</span>
    </div>
  );
};
