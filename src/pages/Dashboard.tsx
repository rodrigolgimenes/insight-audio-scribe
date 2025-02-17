
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
import { formatDuration } from "@/utils/formatDuration";
import { RecordingSheet } from "@/components/dashboard/RecordingSheet";
import { BulkActions } from "@/components/dashboard/BulkActions";

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

  const filteredNotes = notes?.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 flex flex-col">
          <div className="bg-[#9b87f5] p-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
                  <Button size="icon" variant="ghost" className="bg-[#7E69AB] hover:bg-[#6A5A91] text-white">
                    <Mic className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <RecordingSheet />
              </Sheet>
              <Button 
                onClick={() => navigate('/app/record')}
                className="bg-white text-[#9b87f5] hover:bg-[#f8f7fd]"
              >
                TRANSCRIBE FILES
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-8">
              <h2 className="text-xl font-semibold my-6">Recent Files</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
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
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredNotes?.map((note) => (
                      <tr 
                        key={note.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 pl-6 pr-4">
                          <div 
                            className="flex items-center justify-center w-5 h-5 cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNoteSelection(note);
                            }}
                          >
                            <Checkbox 
                              checked={selectedNotes.some(n => n.id === note.id)}
                              className="w-4 h-4"
                            />
                          </div>
                        </td>
                        <td className="py-2 pl-8 pr-4 cursor-pointer" onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <span className="text-[13px]">{note.title}</span>
                        </td>
                        <td className="py-2 px-4 cursor-pointer" onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <span className="text-[13px]">
                            {new Date(note.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="py-2 px-4 cursor-pointer" onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <span className="text-[13px]">{formatDuration(note.duration || 0)}</span>
                        </td>
                        <td className="py-2 px-4 cursor-pointer" onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <span className="text-[13px]">Auto</span>
                        </td>
                        <td className="py-2 px-4 cursor-pointer" onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${note.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              note.status === 'error' ? 'bg-red-100 text-red-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {note.status === 'completed' ? 'Completed' : 
                             note.status === 'error' ? 'Error' : 
                             'Processing'}
                          </span>
                        </td>
                      </tr>
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
