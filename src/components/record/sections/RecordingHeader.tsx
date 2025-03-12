
import React from "react";
import { RecordHeader } from "../RecordHeader";
import { RecordTimer } from "../RecordTimer";

interface RecordingHeaderProps {
  isRecording: boolean;
  isPaused: boolean;
}

export const RecordingHeader = ({ 
  isRecording, 
  isPaused 
}: RecordingHeaderProps) => {
  return (
    <>
      <RecordHeader 
        isRecording={isRecording} 
        isPaused={isPaused} 
      />
      
      <RecordTimer 
        isRecording={isRecording} 
        isPaused={isPaused} 
      />
    </>
  );
};
