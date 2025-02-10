
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
      resolve(Math.round(media.duration));
    };

    media.onerror = () => {
      window.URL.revokeObjectURL(media.src);
      reject(new Error('Error loading media file'));
    };

    media.src = URL.createObjectURL(file);
  });
};
