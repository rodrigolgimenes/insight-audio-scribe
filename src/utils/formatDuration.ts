export const formatDuration = (duration: number | null): string => {
  if (!duration) return "Unknown duration";
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  
  if (minutes > 0) {
    return `${minutes}min ${seconds}s`;
  }
  
  return `${seconds}s`;
};