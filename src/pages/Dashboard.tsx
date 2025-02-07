import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const {
    notes,
    isLoading,
    error,
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder,
    handleDeleteNotes,
  } = useNoteManagement();

  if (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-red-600">Error loading notes</h3>
              <p className="mt-2 text-sm text-gray-500">
                Please try refreshing the page.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <SearchHeader
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
            />

            <DashboardContent
              notes={notes}
              isLoading={isLoading}
              isSelectionMode={isSelectionMode}
              selectedNotes={selectedNotes}
              isFolderDialogOpen={isFolderDialogOpen}
              setIsFolderDialogOpen={setIsFolderDialogOpen}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              onCreateNewFolder={createNewFolder}
              onMoveToFolder={handleMoveToFolder}
              onDeleteNotes={handleDeleteNotes}
              onNoteSelect={toggleNoteSelection}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;