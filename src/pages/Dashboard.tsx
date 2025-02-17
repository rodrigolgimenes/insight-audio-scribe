
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { Mic, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { RecordingSheet } from "@/components/dashboard/RecordingSheet";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { NoteListItem } from "@/components/dashboard/NoteListItem";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecordingSheetOpen, setIsRecordingSheetOpen] = useState(false);
  const navigate = useNavigate();

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
          <div className="bg-primary p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center flex-1 max-w-2xl bg-white rounded-lg">
                <Search className="h-5 w-5 ml-3 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0"
                />
              </div>
              <Sheet open={isRecordingSheetOpen} onOpenChange={setIsRecordingSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="bg-primary-dark hover:bg-primary-dark/90 text-white"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <RecordingSheet onOpenChange={setIsRecordingSheetOpen} />
              </Sheet>
              <Button 
                onClick={() => navigate('/app/record')}
                className="bg-primary-light text-primary hover:bg-primary-light/90"
              >
                TRANSCRIBE FILES
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="px-4">
              <h2 className="text-xl font-semibold my-6">Recent Files</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b text-sm">
                      <th className="py-3 pl-6 pr-4 text-left w-16">
                        <div className="flex items-center justify-center w-5 h-5 cursor-pointer" onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                        }}>
                          <Checkbox 
                            checked={notes && selectedNotes.length === notes.length}
                            className="w-4 h-4"
                          />
                        </div>
                      </th>
                      <th className="py-3 pl-8 pr-4 text-left text-sm font-medium text-gray-500">NAME</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">UPLOAD DATE</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">DURATION</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">MODE</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">STATUS</th>
                      <th className="py-3 px-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredNotes?.map((note) => (
                      <NoteListItem
                        key={note.id}
                        note={note}
                        isSelected={selectedNotes.some(n => n.id === note.id)}
                        onSelect={() => toggleNoteSelection(note)}
                        onClick={() => navigate(`/app/notes/${note.id}`)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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
