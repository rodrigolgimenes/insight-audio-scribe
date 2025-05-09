
import { useEffect } from 'react';

interface RequestLoggerProps {
  urlPattern: string;
  setMonitoring: (value: boolean) => void;
}

export const RequestLogger = ({ urlPattern, setMonitoring }: RequestLoggerProps) => {
  useEffect(() => {
    console.log(`RequestLogger: Starting to monitor requests containing "${urlPattern}"`);
    
    // Store original fetch
    const originalFetch = window.fetch;
    // Store original XMLHttpRequest open method
    const originalXHROpen = XMLHttpRequest.prototype.open;
    
    // Override fetch to monitor requests
    window.fetch = function (input, init) {
      let url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
      if (url.includes(urlPattern)) {
        console.error(`🔍 Intercepted FETCH request to ${url}`);
        console.trace('Stack trace for fetch request:');
      }
      return originalFetch.apply(this, [input, init]);
    };
    
    // Override XMLHttpRequest to monitor requests
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (typeof url === 'string' && url.includes(urlPattern)) {
        console.error(`🔍 Intercepted XHR ${method} request to ${url}`);
        console.trace('Stack trace for XHR request:');
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    // Also intercept HEAD requests which might be harder to catch
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          entry.initiatorType === 'fetch' || 
          entry.initiatorType === 'xmlhttprequest' || 
          entry.initiatorType === 'other'
        ) {
          // @ts-ignore - name property exists in performance entries
          const url = entry.name;
          if (url.includes(urlPattern)) {
            console.error(`🔍 PerformanceObserver caught request to ${url}`);
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    return () => {
      // Restore original functions
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      observer.disconnect();
      setMonitoring(false);
      console.log('RequestLogger: Stopped monitoring requests');
    };
  }, [urlPattern, setMonitoring]);
  
  return null; // This is an invisible component
};
