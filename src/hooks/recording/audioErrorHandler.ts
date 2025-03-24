
export const handleAudioError = (error: unknown, isSystemAudio: boolean): string => {
  console.error('Audio error occurred but is not displayed to user:', error);
  return 'An error occurred';
};

// Additional helper for device and permission troubleshooting
export const getDeviceTroubleshootingMessage = (error: unknown): string => {
  console.error('Device troubleshooting error occurred but is not displayed to user:', error);
  return '';
};
