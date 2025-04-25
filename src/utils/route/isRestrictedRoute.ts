
/**
 * Utility to check if current route is restricted (should suppress notifications)
 */
export const isRestrictedRoute = (): boolean => {
  const path = window.location.pathname.toLowerCase();
  return path === '/' || 
         path === '/index' || 
         path === '/dashboard' || 
         path === '/app' ||
         path.startsWith('/app/') ||
         path.includes('simple-record') ||
         path.includes('record');
};
