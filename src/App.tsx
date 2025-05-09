import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from './components/auth/AuthProvider';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import NotePage from './pages/NotePage';
import ProjectPage from './pages/ProjectPage';
import CreateProjectPage from './pages/CreateProjectPage';
import TagPage from './pages/TagPage';
import UncategorizedFolder from './pages/UncategorizedFolder';
import Settings from './pages/Settings';
import SimpleRecord from './pages/SimpleRecord';
import TestPage from './pages/TestPage';
import NotFound from './pages/NotFound';

interface ShellLayoutProps {
  children: React.ReactNode;
}

const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-gray-50">
      {children}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [session, loading, navigate, location]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};

function Index() {
  return (
    <div className="grid h-screen place-items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to InsightScribe</h1>
        <p className="text-gray-600">Your AI-powered note-taking assistant.</p>
      </div>
    </div>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ShellLayout><Index /></ShellLayout>} />
        <Route path="/app" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/app/note/:noteId" element={
          <ProtectedRoute>
            <NotePage />
          </ProtectedRoute>
        } />
        <Route path="/app/project/:projectId" element={
          <ProtectedRoute>
            <ProjectPage />
          </ProtectedRoute>
        } />
        <Route path="/app/projects/create" element={
          <ProtectedRoute>
            <CreateProjectPage />
          </ProtectedRoute>
        } />
        <Route path="/app/tag/:tagId" element={
          <ProtectedRoute>
            <TagPage />
          </ProtectedRoute>
        } />
        <Route path="/app/uncategorized" element={
          <ProtectedRoute>
            <UncategorizedFolder />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/simple-record" element={<ShellLayout><SimpleRecord /></ShellLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
