
import { createRoot } from 'react-dom/client';
import App from './App';
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

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(<App />);
