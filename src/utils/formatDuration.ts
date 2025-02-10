
export const formatDuration = (duration: number | null): string => {
  if (!duration) return "0:00";
  
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
