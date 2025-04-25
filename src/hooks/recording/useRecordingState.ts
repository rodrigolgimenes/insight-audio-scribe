
import { useState } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";

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
  audioDevices: AudioDevice[];
  setAudioDevices: (devices: AudioDevice[]) => void;
  permissionState: PermissionState;
  setPermissionState: (state: PermissionState) => void;
  recordingMode: 'audio' | 'screen';
  setRecordingMode: (mode: 'audio' | 'screen') => void;
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
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [recordingMode, setRecordingMode] = useState<'audio' | 'screen'>('audio');

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
    setDeviceSelectionReady,
    audioDevices,
    setAudioDevices,
    permissionState,
    setPermissionState,
    recordingMode,
    setRecordingMode
  };
};
