
export const getMediaDuration = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    let media;
    
    if (file.type.startsWith('video/')) {
      media = document.createElement('video');
    } else {
      media = document.createElement('audio');
    }

    media.preload = 'metadata';
    
    media.onloadedmetadata = () => {
      window.URL.revokeObjectURL(media.src);
      // Convert seconds to milliseconds
      resolve(Math.round(media.duration * 1000));
    };

    media.onerror = (e) => {
      window.URL.revokeObjectURL(media.src);
      console.error('Error loading media file:', e);
      // Return a default duration if metadata can't be read
      resolve(0);
    };

    media.src = URL.createObjectURL(file);

    // Add timeout to prevent hanging
    setTimeout(() => {
      window.URL.revokeObjectURL(media.src);
      console.warn('Timeout while getting media duration');
      resolve(0);
    }, 5000);
  });
};
