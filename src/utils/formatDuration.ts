
export const formatDuration = (duration: number | null): string => {
  if (!duration) return "0:00";
  
  // Convert milliseconds to seconds if needed
  // (Some durations may already be in seconds, but we standardize to handle both)
  const totalSeconds = duration > 1000 ? Math.floor(duration / 1000) : Math.floor(duration);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};
