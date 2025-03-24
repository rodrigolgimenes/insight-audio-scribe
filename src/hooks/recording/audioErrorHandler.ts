
export const handleAudioError = (error: unknown, isSystemAudio: boolean): string => {
  // Silently log errors without showing them to the user
  console.error('Audio error occurred but suppressed:', error);
  return '';
};

// Additional helper for device and permission troubleshooting
export const getDeviceTroubleshootingMessage = (error: unknown): string => {
  // Silently log errors without showing them to the user
  console.error('Device troubleshooting error occurred but suppressed:', error);
  return '';
};
