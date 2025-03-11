
import React from "react";
import { MeetingMinutes } from "../MeetingMinutes";

interface MeetingMinutesSectionProps {
  noteId: string;
  transcript: string | null;
  audioUrl: string | null;
  meetingMinutes: string | null;
  isLoadingMinutes: boolean;
}

export const MeetingMinutesSection: React.FC<MeetingMinutesSectionProps> = ({
  noteId,
  transcript,
  audioUrl,
  meetingMinutes,
  isLoadingMinutes
}) => {
  return (
    <MeetingMinutes
      noteId={noteId}
      transcript={transcript}
      audioUrl={audioUrl}
      initialContent={meetingMinutes}
      isLoadingInitialContent={isLoadingMinutes}
    />
  );
};
