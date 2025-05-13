
import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface NoteListProps {
  notes: Note[];
  onSelect: (note: Note) => void;
  selectedNotes: Note[];
  isLoading?: boolean;
  isSelectionMode?: boolean;
}

export const NoteList = ({ 
  notes, 
  onSelect, 
  selectedNotes,
  isLoading = false,
  isSelectionMode = false 
}: NoteListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleNoteClick = (note: Note, event: React.MouseEvent) => {
    if (isSelectionMode) {
      onSelect(note);
      return;
    }
    
    try {
      console.log("Navigating to note from NoteList:", note.id);
      // Verify note ID before navigation
      if (!note.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(note.id)) {
        console.error("Invalid note ID format:", note.id);
        toast({
          title: "Navigation Error",
          description: "This note has an invalid ID and cannot be opened.",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure to include the full path
      navigate(`/app/notes/${note.id}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "Could not open this note. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className={`border rounded p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedNotes.includes(note) ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={(e) => handleNoteClick(note, e)}
        >
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <div className="mt-2 text-gray-600 line-clamp-2">
            {note.processed_content}
          </div>
          {isSelectionMode && (
            <div className="mt-2 flex justify-end">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note)}
                onChange={() => onSelect(note)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
