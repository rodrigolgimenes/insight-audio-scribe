
/**
 * A simplified validator utility for recording prerequisites
 */
export class RecordingValidator {
  /**
   * Logs diagnostic information about recording state
   */
  static logDiagnostics(params: {
    selectedDeviceId: string | null;
    deviceSelectionReady?: boolean;
    audioDevices?: any[];
    isRecording?: boolean;
    permissionsGranted?: boolean;
    permissionState?: string;
  }) {
    console.log('[RecordingValidator] Diagnostics:', params);
    return {
      canStartRecording: true, // Simplified to always allow recording
      issues: [] // No validation issues by default
    };
  }
  
  /**
   * Validates prerequisites for recording
   */
  static validatePrerequisites(params: {
    selectedDeviceId: string | null;
    deviceSelectionReady?: boolean;
    audioDevices?: any[];
    permissionState?: string;
  }) {
    const issues: string[] = [];
    
    // Simple validation
    if (params.permissionState === 'denied') {
      issues.push('Microphone access denied');
    }
    
    return {
      canStartRecording: issues.length === 0,
      issues
    };
  }
}
