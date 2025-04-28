
/**
 * Utility to check if current route is restricted (should suppress notifications)
 * These routes are typically high-level navigation pages where showing microphone
 * notifications would be disruptive to the user experience.
 */
export const isRestrictedRoute = (): boolean => {
  const path = window.location.pathname.toLowerCase();
  
  // Only allow notifications on specific testing/debug pages
  const allowedNotificationRoutes = [
    '/test-record-meeting'
  ];
  
  // Check if the current path is in our allowed routes list
  const isAllowed = allowedNotificationRoutes.includes(path);
  
  // Log for debugging
  console.log(`[isRestrictedRoute] Path: ${path}, Restricted: ${!isAllowed}`);
  
  return !isAllowed;
};
