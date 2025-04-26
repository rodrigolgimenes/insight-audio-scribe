
/**
 * Utility to check if current route is restricted (should suppress notifications)
 * These routes are typically high-level navigation pages where showing microphone
 * notifications would be disruptive to the user experience.
 */
export const isRestrictedRoute = (): boolean => {
  const path = window.location.pathname.toLowerCase();
  return path === '/' || 
         path === '/index' || 
         path === '/index.html' ||
         path === '/dashboard' || 
         path === '/app' ||
         path.startsWith('/app/') ||
         path.includes('simple-record') ||
         path.includes('record');
};
