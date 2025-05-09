
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Clock
} from "lucide-react";

interface StatusIconProps {
  status: string;
}

export const StatusIcon = ({ status }: StatusIconProps) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'awaiting_transcription':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    case 'processing':
    case 'transcribing':
    case 'generating_minutes':
    default:
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
  }
};
