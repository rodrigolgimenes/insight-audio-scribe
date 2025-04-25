
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";

export interface RecordingStateType {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  permissionState: PermissionState;
  setIsRecording: (recording: boolean) => void;
  setLastAction: (action: any) => void;
  isRecording: boolean;
  isPaused: boolean;
  deviceSelectionReady: boolean;
  isSystemAudio: boolean;
  recordingMode: 'audio' | 'screen';
  setRecordingMode: (mode: 'audio' | 'screen') => void;
}
