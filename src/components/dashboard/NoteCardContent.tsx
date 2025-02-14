
import { AlertCircle, Calendar, Folder } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { NoteDuration } from "./NoteDuration";
import { formatDate } from "@/utils/formatDate";
import { TranscriptionStatus } from "@/components/notes/TranscriptionStatus";

interface NoteCardContentProps {
  transcript: string | null;
  duration: number | null;
  createdAt: string;
  status?: string;
  progress?: number;
  folder?: {
    id: string;
    name: string;
  } | null;
}

export const NoteCardContent = ({
  transcript,
  duration,
  createdAt,
  status,
  progress = 100,
  folder,
}: NoteCardContentProps) => {
  // Só mostrar o status se tiver transcrição em andamento
  const showProgress = status && status !== 'completed' && status !== 'error' && transcript === null;

  return (
    <CardContent className="space-y-4">
      {showProgress && (
        <TranscriptionStatus status={status} progress={progress} />
      )}

      {folder ? (
        <div className="flex items-center gap-2 text-gray-700">
          <Folder className="h-4 w-4" />
          <span className="text-sm">
            FOLDER: <span className="font-bold">{folder.name}</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-500">
          <Folder className="h-4 w-4" />
          <span className="text-sm">Uncategorized</span>
        </div>
      )}

      {transcript?.includes('No audio was captured') ? (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>No audio was captured in this recording</span>
        </div>
      ) : transcript ? (
        <div className="text-sm text-gray-600">
          <h3 className="font-semibold mb-1">Transcription:</h3>
          <p className="line-clamp-3">{transcript}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <NoteDuration duration={duration} />
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatDate(createdAt)}
        </span>
      </div>
    </CardContent>
  );
};
