
import React, { Suspense, ErrorBoundary } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AudioRecorder from './pages/AudioRecorder';
import Index from './pages/Index';
import { Toaster } from 'sonner';

// Simple error fallback component
const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
    <p className="text-gray-600 mb-4">We're having trouble loading the application. Please try refreshing the page.</p>
    <button 
      onClick={() => window.location.reload()} 
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      Refresh Page
    </button>
  </div>
);

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Error boundary class component (required by React)
class AppErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error) {
    console.error("Application error:", error);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}

function App() {
  return (
    <>
      <AppErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/audio-recorder" element={<AudioRecorder />} />
            </Routes>
          </Router>
        </Suspense>
      </AppErrorBoundary>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
