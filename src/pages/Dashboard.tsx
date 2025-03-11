import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { Mic, Search, PlusSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { formatDuration } from "@/utils/formatDuration";
import { formatDate } from "@/utils/formatDate";
import { RecordingSheet } from "@/components/dashboard/RecordingSheet";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { NoteStatus } from "@/components/dashboard/NoteStatus";
import { RecordingModeIcon } from "@/components/dashboard/RecordingModeIcon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
          <div className="bg-[#4285F4] p-4 shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center flex-1 max-w-2xl bg-white rounded-lg overflow-hidden">
                <Search className="h-5 w-5 ml-3 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 h-10"
                />
              </div>
              <Sheet open={isRecordingSheetOpen} onOpenChange={setIsRecordingSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="bg-[#3367D6] hover:bg-[#2A56C6] text-white transition-colors"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <RecordingSheet />
              </Sheet>
              <Button 
                onClick={() => navigate('/app/record')}
                className="bg-white text-[#4285F4] hover:bg-[#E8F0FE] transition-colors"
              >
                <PlusSquare className="h-4 w-4 mr-2" />
                TRANSCRIBE FILES
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Files</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <div className="flex items-center justify-center" onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAll();
                      }}>
                        <Checkbox 
                          checked={notes && selectedNotes.length === notes.length && notes.length > 0}
                          className="w-4 h-4"
                        />
                      </div>
                    </TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead>UPLOAD DATE</TableHead>
                    <TableHead>DURATION</TableHead>
                    <TableHead>MODE</TableHead>
                    <TableHead>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-[#4285F4]" />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Loading your files...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredNotes && filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <TableRow 
                        key={note.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <TableCell>
                          <div 
                            className="flex items-center justify-center" 
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
                        </TableCell>
                        <TableCell className="font-medium" onClick={() => navigate(`/app/notes/${note.id}`)}>
                          {note.title}
                        </TableCell>
                        <TableCell onClick={() => navigate(`/app/notes/${note.id}`)}>
                          {formatDate(note.created_at)}
                        </TableCell>
                        <TableCell onClick={() => navigate(`/app/notes/${note.id}`)}>
                          {formatDuration(note.duration || 0)}
                        </TableCell>
                        <TableCell onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <RecordingModeIcon mode="mic" />
                        </TableCell>
                        <TableCell onClick={() => navigate(`/app/notes/${note.id}`)}>
                          <NoteStatus status={note.status || 'processing'} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-gray-500">No files found</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('/app/record')}
                        >
                          <PlusSquare className="h-4 w-4 mr-2" />
                          Create your first transcription
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
