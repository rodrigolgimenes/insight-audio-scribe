// Basic logging utility for the audio converter
const DEBUG = true;

// Format timestamp for logs
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR');
};

// Log storage for UI display
export type LogEntry = {
  id: string;
  timestamp: string;
  category: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
  details?: string;
};

// Log collection to be accessed by UI components
export const logStorage: LogEntry[] = [];

const createLog = (
  category: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG',
  message: string,
  details?: string
): LogEntry => {
  const entry: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp: getTimestamp(),
    category,
    message,
    details
  };
  
  logStorage.push(entry);
  
  // Keep only the most recent 500 logs
  if (logStorage.length > 500) {
    logStorage.shift();
  }
  
  return entry;
};

export const log = (message: string): void => {
  if (DEBUG) {
    console.log(`[AudioConverter] ${message}`);
    createLog('INFO', message);
  }
};

export const logLameJS = (message: string): void => {
  if (DEBUG) {
    console.log(`[LameJS] ${message}`);
    createLog('INFO', message, 'LameJS');
  }
};

export const logWorker = (message: string): void => {
  if (DEBUG) {
    console.log(`[Worker] ${message}`);
    createLog('INFO', message, 'Worker');
  }
};

export const logData = (message: string): void => {
  if (DEBUG) {
    console.log(`[Data] ${message}`);
    createLog('INFO', message, 'Data Processing');
  }
};

export const logFormat = (message: string): void => {
  if (DEBUG) {
    console.log(`[Format] ${message}`);
    createLog('INFO', message, 'Format');
  }
};

export const logValidation = (message: string): void => {
  if (DEBUG) {
    console.log(`[Validation] ${message}`);
    createLog('INFO', message, 'Validation');
  }
};

export const logSuccess = (message: string, details?: string): void => {
  console.log(`[Success] ${message}`);
  createLog('SUCCESS', message, details);
};

export const logError = (message: string, details?: string): void => {
  console.error(`[Error] ${message}`);
  createLog('ERROR', message, details);
};

export const logWarning = (message: string, details?: string): void => {
  console.warn(`[Warning] ${message}`);
  createLog('WARN', message, details);
};

export const clearLogs = (): void => {
  logStorage.length = 0;
};

export const getLogsByCategory = (category: string): LogEntry[] => {
  return logStorage.filter(entry => entry.details === category);
};

// Log groups for UI display
export const logGroups = {
  lameJS: () => getLogsByCategory('LameJS'),
  worker: () => getLogsByCategory('Worker'),
  dataProcessing: () => getLogsByCategory('Data Processing'),
  format: () => getLogsByCategory('Format'),
  validation: () => getLogsByCategory('Validation'),
  all: () => [...logStorage]
};
