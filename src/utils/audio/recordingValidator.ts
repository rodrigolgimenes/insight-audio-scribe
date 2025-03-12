
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
    permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  }) {
    const { 
      selectedDeviceId, 
      deviceSelectionReady, 
      audioDevices, 
      permissionsGranted = true,
      permissionState = 'unknown'
    } = options;
    
    console.log('[RecordingValidator] Validating with:', {
      selectedDeviceId,
      deviceSelectionReady,
      audioDevicesCount: audioDevices.length,
      permissionsGranted,
      permissionState
    });
    
    const diagnostics = {
      canStartRecording: false,
      hasDevices: audioDevices.length > 0,
      deviceSelected: !!selectedDeviceId && selectedDeviceId !== '',
      deviceExists: false,
      deviceSelectionReady,
      permissionsGranted,
      permissionState,
      issues: [] as string[]
    };
    
    // Check if we have devices
    if (!diagnostics.hasDevices) {
      diagnostics.issues.push('No microphone devices detected');
    }
    
    // Check if a device is selected and exists in the device list
    if (!diagnostics.deviceSelected) {
      diagnostics.issues.push('No microphone selected');
    } else {
      // Check if the selected device exists in the device list
      diagnostics.deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      if (!diagnostics.deviceExists) {
        diagnostics.issues.push('Selected microphone not found in device list');
      }
    }
    
    // Check if selection is ready
    if (!diagnostics.deviceSelectionReady) {
      diagnostics.issues.push('Device selection not ready');
    }
    
    // Check permissions - consider both the boolean flag and the permission state
    if (!diagnostics.permissionsGranted || diagnostics.permissionState === 'denied') {
      diagnostics.issues.push('Microphone permission not granted');
    } else if (diagnostics.permissionState === 'prompt') {
      diagnostics.issues.push('Microphone permission needed - please allow when prompted');
    }
    
    // Determine if recording can start - add deviceExists check
    diagnostics.canStartRecording = 
      diagnostics.hasDevices && 
      diagnostics.deviceSelected && 
      diagnostics.deviceExists && 
      diagnostics.deviceSelectionReady && 
      diagnostics.permissionsGranted &&
      diagnostics.permissionState !== 'denied' &&
      diagnostics.permissionState !== 'prompt';
    
    console.log('[RecordingValidator] Validation result:', {
      canStartRecording: diagnostics.canStartRecording,
      hasDevices: diagnostics.hasDevices,
      deviceSelected: diagnostics.deviceSelected,
      deviceExists: diagnostics.deviceExists,
      deviceSelectionReady: diagnostics.deviceSelectionReady,
      permissionsGranted: diagnostics.permissionsGranted,
      permissionState: diagnostics.permissionState,
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
    permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  }) {
    const { isRecording, ...rest } = options;
    const diagnostics = this.validatePrerequisites(rest);
    
    console.group('Recording Diagnostics');
    console.log('Can start recording:', diagnostics.canStartRecording);
    console.log('Currently recording:', isRecording);
    console.log('Has devices:', diagnostics.hasDevices, `(${rest.audioDevices.length} found)`);
    console.log('Device selected:', diagnostics.deviceSelected, rest.selectedDeviceId);
    
    if (diagnostics.deviceSelected) {
      console.log('Selected device exists in list:', diagnostics.deviceExists);
    }
    
    console.log('Device selection ready:', diagnostics.deviceSelectionReady);
    console.log('Permissions granted:', diagnostics.permissionsGranted);
    console.log('Permission state:', rest.permissionState || 'unknown');
    
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
