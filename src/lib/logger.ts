
// Basic logging utility for the audio converter
const DEBUG = true;

export const log = (message: string): void => {
  if (DEBUG) console.log(`[AudioConverter] ${message}`);
};

export const logLameJS = (message: string): void => {
  if (DEBUG) console.log(`[LameJS] ${message}`);
};

export const logWorker = (message: string): void => {
  if (DEBUG) console.log(`[Worker] ${message}`);
};

export const logData = (message: string): void => {
  if (DEBUG) console.log(`[Data] ${message}`);
};

export const logFormat = (message: string): void => {
  if (DEBUG) console.log(`[Format] ${message}`);
};

export const logValidation = (message: string): void => {
  if (DEBUG) console.log(`[Validation] ${message}`);
};
