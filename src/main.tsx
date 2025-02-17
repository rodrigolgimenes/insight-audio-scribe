
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

// Service Worker registration and update handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
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

      console.log('ServiceWorker registered successfully:', registration.scope);
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });

  // Handle controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New ServiceWorker activated');
  });
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
