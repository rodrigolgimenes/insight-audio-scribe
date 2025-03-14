
import { toast } from "@/hooks/use-toast";

type ValidationResult = {
  isValid: boolean;
  errorMessage?: string;
};

export const validateFile = (file?: File): ValidationResult => {
  if (!file) {
    return {
      isValid: false,
      errorMessage: "No file selected."
    };
  }

  // Extended list of supported MIME types
  const allowedTypes = [
    // Audio formats
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/webm', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-m4a',
    'audio/mp4', 'audio/x-aiff', 'audio/basic',
    // Video formats
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 
    'video/x-matroska', 'video/3gpp', 'video/x-flv', 'application/x-mpegURL', 'video/MP2T',
    'video/ogg', 'video/avi', 'video/x-ms-wmv'
  ];
  
  // Supported file extensions for secondary validation
  const supportedExtensions = [
    // Audio extensions
    '.mp3', '.wav', '.webm', '.ogg', '.aac', '.m4a', '.flac', '.aiff', '.au',
    // Video extensions 
    '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.3gp', '.m4v', '.webm', '.ogv'
  ];
  
  // Primary validation by MIME type
  const hasValidMimeType = allowedTypes.includes(file.type);
  
  // Secondary validation by file extension
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const hasValidExtension = supportedExtensions.includes(fileExtension);
  
  // Log for debugging
  console.log(`File validation: Type=${file.type}, Extension=${fileExtension}, ValidMime=${hasValidMimeType}, ValidExt=${hasValidExtension}`);
  
  if (!hasValidMimeType && !hasValidExtension) {
    return {
      isValid: false,
      errorMessage: "Unsupported file format. Please use audio files (MP3, WAV, WebM) or video files (MP4)."
    };
  }

  // Check file size - limiting to 100MB
  const maxSizeInBytes = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      errorMessage: `File is too large. Maximum allowed size is 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
    };
  }

  return { isValid: true };
};

export const showValidationError = (error: string) => {
  toast({
    title: "Error",
    description: error,
    variant: "destructive",
  });
};
