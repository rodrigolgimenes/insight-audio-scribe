
import { useState } from "react";

export type RecordingStateType = {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
  audioUrl: string | null;
  setAudioUrl: (audioUrl: string | null) => void;
  mediaStream: MediaStream | null;
  setMediaStream: (mediaStream: MediaStream | null) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  isTranscribing: boolean;
  setIsTranscribing: (isTranscribing: boolean) => void;
  isSystemAudio: boolean;
  setIsSystemAudio: (isSystemAudio: boolean) => void;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string | null) => void;
  lastAction: { action: string; timestamp: number; success: boolean; error?: string } | null;
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void;
  recordingAttemptsCount: number;
  setRecordingAttemptsCount: (count: number | ((prev: number) => number)) => void;
  deviceSelectionReady: boolean;
  setDeviceSelectionReady: (ready: boolean) => void;
};

export const useRecordingState = (): RecordingStateType => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSystemAudio, setIsSystemAudio] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{
    action: string;
    timestamp: number;
    success: boolean;
    error?: string;
  } | null>(null);
  const [recordingAttemptsCount, setRecordingAttemptsCount] = useState(0);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);

  return {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    audioUrl,
    setAudioUrl,
    mediaStream,
    setMediaStream,
    isSaving,
    setIsSaving,
    isTranscribing,
    setIsTranscribing,
    isSystemAudio,
    setIsSystemAudio,
    selectedDeviceId,
    setSelectedDeviceId,
    lastAction,
    setLastAction,
    recordingAttemptsCount,
    setRecordingAttemptsCount,
    deviceSelectionReady,
    setDeviceSelectionReady
  };
};
