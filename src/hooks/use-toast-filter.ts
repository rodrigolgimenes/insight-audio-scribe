
import { toast, ToastProps } from "@/hooks/use-toast";

// Lista de strings que podem indicar uma notificação relacionada a microfone
const MICROPHONE_KEYWORDS = [
  'microphone',
  'microfone',
  'mic ',
  'mic.',
  'audio device',
  'audio input',
  'recording device',
  'detect',
  'permission'
];

// Wrapper para toast que filtra mensagens relacionadas a microfones
export function safeToast(
  message: string,
  data?: Omit<ToastProps, "title" | "description">
) {
  // Verifique se a mensagem contém palavras-chave relacionadas a microfones
  const isMicrophoneRelated = MICROPHONE_KEYWORDS.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );

  // Se for relacionada a microfone, apenas registre no console, mas não mostre a toast
  if (isMicrophoneRelated) {
    console.log("[toast-filter] Suppressed microphone toast:", message);
    return { id: "suppressed-toast" };
  }

  // Caso contrário, mostre a toast normalmente
  return toast(message, data);
}

// Equivalentes para todos os métodos do toast
export const safeToastMethods = {
  success: (message: string, data?: Omit<ToastProps, "title" | "description">) => {
    if (MICROPHONE_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      console.log("[toast-filter] Suppressed microphone success toast:", message);
      return { id: "suppressed-toast" };
    }
    return toast.success(message, data);
  },
  error: (message: string, data?: Omit<ToastProps, "title" | "description">) => {
    if (MICROPHONE_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      console.log("[toast-filter] Suppressed microphone error toast:", message);
      return { id: "suppressed-toast" };
    }
    return toast.error(message, data);
  },
  warning: (message: string, data?: Omit<ToastProps, "title" | "description">) => {
    if (MICROPHONE_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      console.log("[toast-filter] Suppressed microphone warning toast:", message);
      return { id: "suppressed-toast" };
    }
    return toast.warning(message, data);
  },
  info: (message: string, data?: Omit<ToastProps, "title" | "description">) => {
    if (MICROPHONE_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      console.log("[toast-filter] Suppressed microphone info toast:", message);
      return { id: "suppressed-toast" };
    }
    return toast.info(message, data);
  }
};

// Exporte diretamente o objeto original do toast para compatibilidade
export { toast } from "@/hooks/use-toast";
