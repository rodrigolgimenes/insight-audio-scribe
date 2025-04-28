
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginPage } from "@/components/auth/LoginPage";
import { AuthCallback } from "@/components/auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import SimpleRecord from "./pages/SimpleRecord";
import TestRecordMeeting from "./pages/TestRecordMeeting";
import NotePage from "./pages/NotePage";
import FolderPage from "./pages/FolderPage";
import TagPage from "./pages/TagPage";
import TestPage from "./pages/TestPage";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import UncategorizedFolder from "./pages/UncategorizedFolder";
import NotFound from "./pages/NotFound";

const RouteLogger = () => {
  const location = useLocation();
  
  React.useEffect(() => {
    console.log('[App] Route changed:', {
      pathname: location.pathname,
      isRestricted: ["/", "/index", "/dashboard", "/app"].includes(location.pathname) || 
                    location.pathname.startsWith("/app/")
    });
  }, [location]);
  
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!session) {
    console.log("[ProtectedRoute] No session, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      meta: {
        onError: (error: Error) => {
          console.error("Query error:", error);
        }
      }
    },
  },
});

const App = () => {
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || "Unknown error occurred");
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-white p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-700 mb-4">{errorMessage}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-palatinate-blue text-white px-4 py-2 rounded hover:bg-palatinate-blue/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <RouteLogger />
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/simple-record" element={<SimpleRecord />} />
              <Route path="/test-record-meeting" element={<TestRecordMeeting />} />
              <Route
                path="/app/notes/:noteId"
                element={
                  <ProtectedRoute>
                    <NotePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/folder/:folderId"
                element={
                  <ProtectedRoute>
                    <FolderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/uncategorized"
                element={
                  <ProtectedRoute>
                    <UncategorizedFolder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/tag/:tagId"
                element={
                  <ProtectedRoute>
                    <TagPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test"
                element={
                  <ProtectedRoute>
                    <TestPage />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/SimpleRecord" 
                element={<Navigate to="/simple-record" replace />} 
              />
              <Route 
                path="/index" 
                element={<Navigate to="/" replace />} 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
