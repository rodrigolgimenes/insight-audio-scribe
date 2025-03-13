
/**
 * Formats a duration in milliseconds to a human-readable string format (MM:SS)
 */
export const formatDuration = (durationMs: number | null): string => {
  if (!durationMs || durationMs <= 0) {
    return "0:00";
  }
  
  // Convert milliseconds to seconds
  const totalSeconds = Math.round(durationMs / 1000);
  
  // Calculate minutes and remaining seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Format seconds with leading zero if needed
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  
  return `${minutes}:${formattedSeconds}`;
};
