
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
      audioDeviceIds: audioDevices.map(d => d.deviceId),
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
    
    // Verificar explicitamente se o dispositivo existe na lista
    if (diagnostics.deviceSelected && selectedDeviceId) {
      diagnostics.deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      console.log('[RecordingValidator] Device existence check:', {
        deviceExists: diagnostics.deviceExists,
        selectedDeviceId: selectedDeviceId,
        availableDeviceIds: audioDevices.map(d => d.deviceId)
      });
    }
    
    // Verificar se temos dispositivos
    if (!diagnostics.hasDevices) {
      diagnostics.issues.push('Nenhum microfone detectado');
    }
    
    // Verificar se um dispositivo está selecionado
    if (!diagnostics.deviceSelected) {
      diagnostics.issues.push('Nenhum microfone selecionado');
    } else if (!diagnostics.deviceExists) {
      // O dispositivo selecionado não existe na lista de dispositivos
      diagnostics.issues.push('O microfone selecionado não foi encontrado na lista de dispositivos');
    }
    
    // Verificar se a seleção está pronta
    if (!diagnostics.deviceSelectionReady) {
      diagnostics.issues.push('Seleção de dispositivo não está pronta');
    }
    
    // Verificar permissões - considerar tanto a flag booleana quanto o estado de permissão
    if (!diagnostics.permissionsGranted || diagnostics.permissionState === 'denied') {
      diagnostics.issues.push('Permissão de microfone não concedida');
    } else if (diagnostics.permissionState === 'prompt') {
      diagnostics.issues.push('Permissão de microfone necessária - por favor, permita quando solicitado');
    }
    
    // Determinar se a gravação pode começar - adicionar verificação deviceExists
    diagnostics.canStartRecording = 
      diagnostics.hasDevices && 
      diagnostics.deviceSelected && 
      diagnostics.deviceExists && 
      diagnostics.deviceSelectionReady && 
      diagnostics.permissionsGranted &&
      diagnostics.permissionState !== 'denied' &&
      diagnostics.permissionState !== 'prompt';
    
    console.log('[RecordingValidator] Resultado da validação:', {
      canStartRecording: diagnostics.canStartRecording,
      hasDevices: diagnostics.hasDevices,
      deviceSelected: diagnostics.deviceSelected,
      deviceExists: diagnostics.deviceExists,
      deviceSelectionReady: diagnostics.deviceSelectionReady,
      permissionsGranted: diagnostics.permissionsGranted,
      permissionState: diagnostics.permissionState,
      issues: diagnostics.issues.length > 0 ? diagnostics.issues : 'nenhum'
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
    
    console.group('Diagnóstico de Gravação');
    console.log('Pode iniciar gravação:', diagnostics.canStartRecording);
    console.log('Gravando atualmente:', isRecording);
    console.log('Tem dispositivos:', diagnostics.hasDevices, `(${rest.audioDevices.length} encontrados)`);
    console.log('Dispositivo selecionado:', diagnostics.deviceSelected, rest.selectedDeviceId);
    
    if (diagnostics.deviceSelected) {
      console.log('Dispositivo selecionado existe na lista:', diagnostics.deviceExists);
    }
    
    console.log('Seleção de dispositivo pronta:', diagnostics.deviceSelectionReady);
    console.log('Permissões concedidas:', diagnostics.permissionsGranted);
    console.log('Estado de permissão:', rest.permissionState || 'desconhecido');
    
    if (diagnostics.issues.length > 0) {
      console.log('Problemas detectados:');
      diagnostics.issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('Nenhum problema detectado');
    }
    
    if (rest.audioDevices.length > 0) {
      console.log('Dispositivos disponíveis:');
      rest.audioDevices.forEach((device, index) => {
        console.log(`- Dispositivo ${index + 1}: ID=${device.deviceId} Label=${device.label || 'Dispositivo sem nome'}`);
      });
    }
    
    console.groupEnd();
    
    return diagnostics;
  }
}
