
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

  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4'];
  if (!allowedTypes.includes(file.type)) {
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
