import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useNoteManagement } from "@/hooks/useNoteManagement";

const Dashboard = () => {
  const {
    notes,
    isLoading,
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