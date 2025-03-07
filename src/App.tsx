
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LoginPage } from "@/components/auth/LoginPage";
import { AuthCallback } from "@/components/auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import SimpleRecord from "./pages/SimpleRecord";
import NotePage from "./pages/NotePage";
import FolderPage from "./pages/FolderPage";
import TagPage from "./pages/TagPage";
import TestPage from "./pages/TestPage";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import UncategorizedFolder from "./pages/UncategorizedFolder";

// Modified to completely bypass authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Temporarily bypass all authentication checks
  return <>{children}</>;
};

// Create the query client instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
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
                path="/simple-record"
                element={
                  <ProtectedRoute>
                    <SimpleRecord />
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
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
