
import React, { useEffect } from "react";
import { Toaster as OriginalToaster } from "@/components/ui/toaster";

// Componente que substitui o Toaster original com um que filtra notificações de microfone
export function FilteredToast() {
  useEffect(() => {
    // Sobrescreva a função toast.create para filtrar mensagens sobre microfones
    const originalToast = window.toast;
    if (originalToast && originalToast.create) {
      const originalCreate = originalToast.create;
      
      // @ts-ignore - Modificando objeto global
      window.toast.create = function(props: any) {
        // Verifique se é sobre microfone
        const isMicrophoneRelated = 
          (typeof props.title === 'string' && isMicrophoneMessage(props.title)) ||
          (typeof props.description === 'string' && isMicrophoneMessage(props.description));
        
        // Se for sobre microfone, registre no console mas não mostre
        if (isMicrophoneRelated) {
          console.log("[FilteredToast] Suppressed microphone toast:", props);
          return { id: "suppressed-toast" };
        }
        
        // Caso contrário, continue normalmente
        return originalCreate(props);
      };
    }
    
    // Cleanup quando o componente for desmontado
    return () => {
      // Restaure a função original se necessário
      if (window.toast && originalToast && originalToast.create) {
        // @ts-ignore
        window.toast.create = originalCreate;
      }
    };
  }, []);
  
  // Função auxiliar para verificar se uma mensagem está relacionada a microfone
  function isMicrophoneMessage(message: string) {
    const microphoneKeywords = [
      'microphone', 'microfone', 'mic', 'audio device', 'audio input',
      'recording device', 'detect', 'permission'
    ];
    
    return microphoneKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  return <OriginalToaster />;
}
