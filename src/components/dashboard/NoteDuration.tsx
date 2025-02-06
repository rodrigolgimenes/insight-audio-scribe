import { Clock } from "lucide-react";
import { formatDuration } from "@/utils/formatDuration";

interface NoteDurationProps {
  duration: number | null;
}

export const NoteDuration = ({ duration }: NoteDurationProps) => {
  return (
    <span className="flex items-center gap-1">
      <Clock className="h-4 w-4" />
      {formatDuration(duration)}
    </span>
  );
};