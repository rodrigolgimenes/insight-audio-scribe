
// Constants for file size and duration limits
export const MAX_AUDIO_DURATION_MS = 120 * 60 * 1000; // 120 minutes in milliseconds
export const MAX_FILE_SIZE_MB = 100; // 100 MB

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Progress percentage stages for consistent progress reporting
export const PROGRESS_STAGES = {
  STARTED: 5,
  DOWNLOADING: 15,
  DOWNLOADED: 25,
  PROCESSING: 40,
  TRANSCRIBING: 60,
  TRANSCRIBED: 80,
  GENERATING_MINUTES: 90,
  COMPLETED: 100
};

// Valid status values for the notes table - MUST match exactly with the database enum constraint
export const VALID_NOTE_STATUSES = [
  'pending',
  'processing',
  'transcribing',
  'generating_minutes',
  'completed',
  'error'
];

// Valid status values for the recordings table
export const VALID_RECORDING_STATUSES = [
  'pending',
  'uploaded',
  'processing',
  'completed',
  'error'
];
