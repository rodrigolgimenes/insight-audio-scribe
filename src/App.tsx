import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LoginPage } from "@/components/auth/LoginPage";
import Dashboard from "./pages/Dashboard";
import Record from "./pages/Record";
import SimpleRecord from "./pages/SimpleRecord";
import NotePage from "./pages/NotePage";
import NotesRecord from "./pages/NotesRecord";
import RecordingsPage from "./pages/RecordingsPage";
import FolderPage from "./pages/FolderPage";
import StylesPage from "./pages/StylesPage";
import TestPage from "./pages/TestPage";
import Index from "./pages/Index";
import { useAuth } from "@/components/auth/AuthProvider";

const queryClient = new QueryClient();

// Temporarily modified to bypass authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
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
              path="/app/notes-record/:recordingId"
              element={
                <ProtectedRoute>
                  <NotesRecord />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/recordings"
              element={
                <ProtectedRoute>
                  <RecordingsPage />
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
              path="/app/styles"
              element={
                <ProtectedRoute>
                  <StylesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/record"
              element={
                <ProtectedRoute>
                  <Record />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;