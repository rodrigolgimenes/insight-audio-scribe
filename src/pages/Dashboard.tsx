
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotesTable } from "@/components/dashboard/NotesTable";
import { BulkActions } from "@/components/dashboard/BulkActions";

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
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    handleDeleteNotes,
  } = useNoteManagement();

  const handleSelectAll = () => {
    if (notes && selectedNotes.length === notes.length) {
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
  };

  if (error) {
    return (
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
    );
  }

  const filteredNotes = notes?.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        <AppSidebar activePage="notes" />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <DashboardHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isRecordingSheetOpen={isRecordingSheetOpen}
            setIsRecordingSheetOpen={setIsRecordingSheetOpen}
          />

          <div className="flex-1 overflow-auto">
            <div className="px-4">
              <h2 className="text-xl font-semibold my-6">Recent Files</h2>
              <NotesTable
                notes={filteredNotes}
                selectedNotes={selectedNotes}
                onSelectAll={handleSelectAll}
                toggleNoteSelection={toggleNoteSelection}
              />
            </div>
          </div>

          {selectedNotes.length > 0 && (
            <div className="fixed bottom-0 left-[280px] right-0">
              <BulkActions
                selectedCount={selectedNotes.length}
                onExport={() => setIsFolderDialogOpen(true)}
                onMove={() => setIsFolderDialogOpen(true)}
                onDelete={handleDeleteNotes}
              />
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
