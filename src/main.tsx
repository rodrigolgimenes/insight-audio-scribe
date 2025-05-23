
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "sonner";
import { LazyTranscriptionProvider } from './providers/LazyTranscriptionProvider';
import { DeviceManagerProvider } from './context/DeviceManagerContext';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DeviceManagerProvider>
        <AuthProvider>
          <LazyTranscriptionProvider>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </LazyTranscriptionProvider>
        </AuthProvider>
      </DeviceManagerProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
