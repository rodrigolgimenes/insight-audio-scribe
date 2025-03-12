
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as Sentry from "@sentry/react";

// Initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [],
    tracesSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

// Service Worker registration - with improved error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Skip service worker registration in preview environments
      const isPreviewEnvironment = 
        window.location.hostname.includes('preview--') || 
        window.location.hostname.includes('lovable.app');

      // Only register in true production environment
      if (isPreviewEnvironment) {
        console.log('Service Worker registration skipped in preview environment');
      } else if (import.meta.env.PROD) {
        // Try to register the service worker
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  if (confirm('New version available! Would you like to update?')) {
                    newWorker.postMessage('SKIP_WAITING');
                    window.location.reload();
                  }
                }
              });
            }
          });

          console.log('ServiceWorker registration successful:', registration.scope);
        } catch (registrationError) {
          console.error('ServiceWorker registration failed:', registrationError);
          // Continue without service worker
        }
      }
    } catch (error) {
      console.error('Error during ServiceWorker registration check:', error);
      // Continue without service worker
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
