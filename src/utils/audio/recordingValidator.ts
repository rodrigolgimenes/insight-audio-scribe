
/**
 * Utility for validating recording prerequisites and diagnosing issues
 */
export class RecordingValidator {
  /**
   * Validates if recording can start and provides detailed diagnostics
   */
  static validatePrerequisites(options: {
    selectedDeviceId: string | null;
    deviceSelectionReady: boolean;
    audioDevices: any[];
    permissionsGranted?: boolean;
  }) {
    const { selectedDeviceId, deviceSelectionReady, audioDevices, permissionsGranted = true } = options;
    
    console.log('[RecordingValidator] Validating with:', {
      selectedDeviceId,
      deviceSelectionReady,
      audioDevicesCount: audioDevices.length,
      permissionsGranted
    });
    
    const diagnostics = {
      canStartRecording: false,
      hasDevices: audioDevices.length > 0,
      deviceSelected: !!selectedDeviceId && selectedDeviceId !== '',
      deviceSelectionReady,
      permissionsGranted,
      issues: [] as string[]
    };
    
    // Check if we have devices
    if (!diagnostics.hasDevices) {
      diagnostics.issues.push('No microphone devices detected');
    }
    
    // Check if a device is selected
    if (!diagnostics.deviceSelected) {
      diagnostics.issues.push('No microphone selected');
    }
    
    // Check if selection is ready
    if (!diagnostics.deviceSelectionReady) {
      diagnostics.issues.push('Device selection not ready');
    }
    
    // Check permissions
    if (!diagnostics.permissionsGranted) {
      diagnostics.issues.push('Microphone permission not granted');
    }
    
    // Determine if recording can start
    diagnostics.canStartRecording = 
      diagnostics.hasDevices && 
      diagnostics.deviceSelected && 
      diagnostics.deviceSelectionReady && 
      diagnostics.permissionsGranted;
    
    console.log('[RecordingValidator] Validation result:', {
      canStartRecording: diagnostics.canStartRecording,
      issues: diagnostics.issues.length > 0 ? diagnostics.issues : 'none'
    });
    
    return diagnostics;
  }
  
  /**
   * Logs diagnostic information about the current recording state
   */
  static logDiagnostics(options: {
    selectedDeviceId: string | null;
    deviceSelectionReady: boolean;
    audioDevices: any[];
    isRecording: boolean;
    permissionsGranted?: boolean;
  }) {
    const { isRecording, ...rest } = options;
    const diagnostics = this.validatePrerequisites(rest);
    
    console.group('Recording Diagnostics');
    console.log('Can start recording:', diagnostics.canStartRecording);
    console.log('Currently recording:', isRecording);
    console.log('Has devices:', diagnostics.hasDevices, `(${rest.audioDevices.length} found)`);
    console.log('Device selected:', diagnostics.deviceSelected, rest.selectedDeviceId);
    console.log('Device selection ready:', diagnostics.deviceSelectionReady);
    console.log('Permissions granted:', diagnostics.permissionsGranted);
    
    if (diagnostics.issues.length > 0) {
      console.log('Issues detected:');
      diagnostics.issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('No issues detected');
    }
    
    if (rest.audioDevices.length > 0) {
      console.log('Available devices:');
      rest.audioDevices.forEach((device, index) => {
        console.log(`- Device ${index + 1}: ID=${device.deviceId} Label=${device.label || 'Unnamed device'}`);
      });
    }
    
    console.groupEnd();
    
    return diagnostics;
  }
}
