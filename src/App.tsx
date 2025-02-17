
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotePage from "./pages/NotePage";
import SimpleRecord from "./pages/SimpleRecord";
import FolderPage from "./pages/FolderPage";
import TagPage from "./pages/TagPage";
import UncategorizedFolder from "./pages/UncategorizedFolder";
import { LoginPage } from "./components/auth/LoginPage";
import { AuthCallback } from "./components/auth/AuthCallback";
import { AuthProvider } from "./components/auth/AuthProvider";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/settings" element={<Settings />} />
            <Route path="/app/note/:noteId" element={<NotePage />} />
            <Route path="/app/record" element={<SimpleRecord />} />
            <Route path="/app/folder/:folderId" element={<FolderPage />} />
            <Route path="/app/tag/:tagId" element={<TagPage />} />
            <Route path="/app/uncategorized" element={<UncategorizedFolder />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
