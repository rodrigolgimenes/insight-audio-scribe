
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

// Service Worker registration - only in production and if supported
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // Check if we're in a controlled environment where Service Workers might not be allowed
      if (window.location.hostname.includes('preview--') || 
          window.location.hostname.includes('lovable.app')) {
        console.log('Service Worker registration skipped in preview environment');
      } else {
        // Only register in true production environment
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
      }
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
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
