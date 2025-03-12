
import { useCallback } from "react";
import { toast } from "sonner";

export const useBrowserCompatibilityCheck = () => {
  // Check if this browser is known to have issues with device detection
  const checkBrowserCompatibility = useCallback(() => {
    const ua = navigator.userAgent;
    const isMobileSafari = /iPhone|iPad|iPod/.test(ua) && !ua.includes('CriOS') && !ua.includes('FxiOS');
    const isOldEdge = /Edge\/\d+/.test(ua);
    const isIE = /Trident|MSIE/.test(ua);
    
    if (isMobileSafari || isOldEdge || isIE) {
      console.warn('[useBrowserCompatibilityCheck] Potentially problematic browser detected:', ua);
      
      toast.info("Your browser may have limited microphone support", {
        description: "For best results, use Chrome, Firefox, or Edge",
        duration: 5000,
        id: "browser-compatibility-warning"
      });
      
      return false;
    }
    return true;
  }, []);

  return { checkBrowserCompatibility };
};
