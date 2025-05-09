import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { ProjectDialog } from "@/components/dashboard/ProjectDialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecordingSheetOpen, setIsRecordingSheetOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();

  const {
    notes,
    isLoading,
    error,
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    newProjectName,
    setNewProjectName,
    createNewProject,
    handleMoveToProject,
    handleDeleteNotes,
  } = useNoteManagement();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthReady(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [toast]);

  const handleSelectAll = () => {
    if (notes && selectedNotes.length === notes.length) {
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
  };

  if (!isAuthReady) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-ghost-white">
          <AppSidebar activePage="notes" />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-palatinate-blue" />
              <p className="text-lg">Checking authentication...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Error handling component that keeps the SidebarProvider intact
  if (error) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-ghost-white">
          <AppSidebar activePage="notes" />
          <main className="flex-1 p-6">
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-red-100">
              <h3 className="text-lg font-medium text-red-600">Error loading notes</h3>
              <p className="mt-2 text-sm text-gray-500">
                Please try refreshing the page or check your network connection.
              </p>
              <pre className="mt-4 bg-gray-50 p-4 rounded text-xs text-left max-w-xl mx-auto overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const filteredNotes = notes?.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-ghost-white overflow-hidden">
        <AppSidebar activePage="notes" />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-ghost-white">
          <DashboardHeader 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isRecordingSheetOpen={isRecordingSheetOpen}
            setIsRecordingSheetOpen={setIsRecordingSheetOpen}
          />

          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Files</h2>
            <DashboardContent 
              notes={filteredNotes}
              isLoading={isLoading}
              isSelectionMode={isSelectionMode}
              selectedNotes={selectedNotes}
              handleSelectAll={handleSelectAll}
              toggleNoteSelection={toggleNoteSelection}
            />
          </div>

          {selectedNotes.length > 0 && (
            <div className="fixed bottom-0 left-[280px] right-0 bg-ghost-white">
              <BulkActions
                selectedCount={selectedNotes.length}
                onExport={() => setIsProjectDialogOpen(true)}
                onMove={() => setIsProjectDialogOpen(true)}
                onDelete={handleDeleteNotes}
              />
            </div>
          )}

          <ProjectDialog
            isOpen={isProjectDialogOpen}
            onOpenChange={setIsProjectDialogOpen}
            projects={[]} // We'll fetch projects in the component
            currentProjectId={null}
            newProjectName={newProjectName}
            onNewProjectNameChange={setNewProjectName}
            onCreateNewProject={createNewProject}
            onSelectProject={handleMoveToProject}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
