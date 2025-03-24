
/**
 * Simple logger utility for the application
 */

// Store logs in memory for debugging
const memoryLogs: string[] = [];
const MAX_LOG_LENGTH = 1000;

// Log types
let enabledLogTypes: Record<string, boolean> = {
  'default': true,
  'audio': true,
  'worker': true,
  'lamejs': true,
  'format': true,
  'data': true,
  'validation': true,
};

/**
 * Global log function
 */
export function log(message: string, type: string = 'default'): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  // Add to memory logs, limiting size
  memoryLogs.push(formattedMessage);
  if (memoryLogs.length > MAX_LOG_LENGTH) {
    memoryLogs.shift();
  }
  
  // Only log to console if enabled
  if (enabledLogTypes[type] || type === 'default') {
    console.log(`[${type}] ${message}`);
  }
}

/**
 * Specialized log functions
 */
export function logLameJS(message: string): void {
  log(message, 'lamejs');
}

export function logWorker(message: string): void {
  log(message, 'worker');
}

export function logData(message: string): void {
  log(message, 'data');
}

export function logFormat(message: string): void {
  log(message, 'format');
}

export function logValidation(message: string): void {
  log(message, 'validation');
}

/**
 * Get all logs
 */
export function getLogs(): string[] {
  return [...memoryLogs];
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  memoryLogs.length = 0;
}

/**
 * Configure which log types are output to console
 */
export function configureLogTypes(types: Record<string, boolean>): void {
  enabledLogTypes = {...enabledLogTypes, ...types};
}
