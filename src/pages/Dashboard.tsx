import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { ProjectDialog } from "@/components/dashboard/ProjectDialog";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecordingSheetOpen, setIsRecordingSheetOpen] = useState(false);

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

  const handleSelectAll = () => {
    if (notes && selectedNotes.length === notes.length) {
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
  };

  // Error handling component that keeps the SidebarProvider intact
  if (error) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-gray-50">
          <AppSidebar activePage="notes" />
          <main className="flex-1">
            <div className="w-full px-6 py-8">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-red-600">Error loading notes</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Please try refreshing the page.
                </p>
              </div>
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
