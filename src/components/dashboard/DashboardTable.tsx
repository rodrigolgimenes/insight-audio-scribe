import { useNavigate } from "react-router-dom";
import { Loader2, PlusSquare } from "lucide-react";
import { Note } from "@/integrations/supabase/types/notes";
import { formatDate } from "@/utils/formatDate";
import { formatDuration } from "@/utils/formatDuration";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RecordingModeIcon } from "@/components/dashboard/RecordingModeIcon";
import { NoteStatus } from "@/components/dashboard/NoteStatus";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DashboardTableProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  onSelectAll: () => void;
  onToggleNoteSelection: (note: Note) => void;
}

export const DashboardTable = ({
  notes,
  isLoading,
  isSelectionMode,
  selectedNotes,
  onSelectAll,
  onToggleNoteSelection
}: DashboardTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#4285F4]" />
        </div>
        <p className="mt-2 text-sm text-gray-500">Loading your files...</p>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No files found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/app/record')}
        >
          <PlusSquare className="h-4 w-4 mr-2" />
          Create your first transcription
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <div className="flex items-center justify-center" onClick={(e) => {
              e.stopPropagation();
              onSelectAll();
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
        {notes.map((note) => (
          <TableRow 
            key={note.id}
            className="hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <TableCell>
              <div 
                className="flex items-center justify-center" 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleNoteSelection(note);
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
        ))}
      </TableBody>
    </Table>
  );
};
