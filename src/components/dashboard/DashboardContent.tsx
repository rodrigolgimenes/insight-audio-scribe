import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { BulkActions } from "./BulkActions";
import { FolderDialog } from "./FolderDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, AlertCircle, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  isFolderDialogOpen: boolean;
  setIsFolderDialogOpen: (value: boolean) => void;
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  onCreateNewFolder: () => Promise<void>;
  onMoveToFolder: (folderId: string) => Promise<void>;
  onDeleteNotes: () => Promise<void>;
  onNoteSelect: (note: Note) => void;
}

export const DashboardContent = ({
  notes,
  isLoading,
  isSelectionMode,
  selectedNotes,
  isFolderDialogOpen,
  setIsFolderDialogOpen,
  newFolderName,
  setNewFolderName,
  onCreateNewFolder,
  onMoveToFolder,
  onDeleteNotes,
  onNoteSelect,
}: DashboardContentProps) => {
  const navigate = useNavigate();

  const handleNoteClick = (note: Note) => {
    if (isSelectionMode) {
      onNoteSelect(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "Unknown duration";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isSelectionMode && selectedNotes.length > 0 && (
        <BulkActions
          selectedNotes={selectedNotes}
          onMoveToFolder={() => setIsFolderDialogOpen(true)}
          onDelete={onDeleteNotes}
        />
      )}

      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={cn(
                "hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 relative",
                isSelectionMode && selectedNotes.includes(note) && "bg-gray-50 ring-2 ring-primary"
              )}
              onClick={() => handleNoteClick(note)}
            >
              {isSelectionMode && (
                <div className="absolute top-4 right-4">
                  <CheckSquare 
                    className={cn(
                      "h-6 w-6",
                      selectedNotes.includes(note) ? "text-primary" : "text-gray-300"
                    )} 
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.original_transcript?.includes('No audio was captured') ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>No audio was captured in this recording</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <h3 className="font-semibold mb-1">Transcription:</h3>
                    <p className="line-clamp-3">{note.original_transcript}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Unknown duration
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folders={[]}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateNewFolder={onCreateNewFolder}
        onSelectFolder={onMoveToFolder}
      />
    </>
  );
};