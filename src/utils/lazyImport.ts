
import { lazy } from 'react';

// Generic function for lazy importing components
export function lazyImport<
  T extends React.ComponentType<any>,
  I extends { [K2 in K]: T },
  K extends keyof I
>(factory: () => Promise<I>, name: K): I {
  return Object.create({
    [name]: lazy(() => factory().then((module) => ({ default: module[name] }))),
  });
}

// Helper for lazy importing transcription components
export const lazyTranscriptionImport = <K extends string>(
  importFn: () => Promise<Record<K, any>>,
  key: K
) => {
  // Check if we're in an authenticated route before importing
  if (!window.location.pathname.startsWith('/app') && window.location.pathname !== '/settings') {
    console.log('Not loading transcription component - not in authenticated route');
    return null;
  }
  
  return lazyImport(importFn, key);
};
