
import { AlertCircle, Calendar, Folder } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { NoteDuration } from "./NoteDuration";
import { formatDate } from "@/utils/formatDate";

interface NoteCardContentProps {
  transcript: string | null;
  duration: number | null;
  createdAt: string;
  folder?: {
    id: string;
    name: string;
  } | null;
}

export const NoteCardContent = ({
  transcript,
  duration,
  createdAt,
  folder,
}: NoteCardContentProps) => {
  return (
    <CardContent className="space-y-4">
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
      ) : (
        <div className="text-sm text-gray-600">
          <h3 className="font-semibold mb-1">Transcription:</h3>
          <p className="line-clamp-3">{transcript}</p>
        </div>
      )}
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
