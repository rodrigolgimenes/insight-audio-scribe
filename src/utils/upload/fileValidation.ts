
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

  // Lista expandida de tipos MIME suportados
  const allowedTypes = [
    // Formatos de áudio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/webm', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-m4a',
    // Formatos de vídeo
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'
  ];
  
  // Extensões de arquivo suportadas para verificação secundária
  const supportedExtensions = ['.mp3', '.wav', '.webm', '.ogg', '.aac', '.m4a', '.flac', '.mp4', '.mov', '.avi'];
  
  // Verificação primária por MIME type
  const hasValidMimeType = allowedTypes.includes(file.type);
  
  // Verificação secundária por extensão de arquivo (caso o MIME type não seja reconhecido corretamente)
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const hasValidExtension = supportedExtensions.includes(fileExtension);
  
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
