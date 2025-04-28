
export interface RecordingStateType {
  audioDevices: any[];
  selectedDeviceId: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  setIsRecording: (recording: boolean) => void;
  setLastAction: (action: any) => void;
  isRecording: boolean;
  isPaused: boolean;
  deviceSelectionReady: boolean;
  isSystemAudio: boolean;
}
