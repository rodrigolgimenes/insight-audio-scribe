
import { Note } from "@/integrations/supabase/types/notes";
import { Checkbox } from "@/components/ui/checkbox";
import { NoteListItem } from "./NoteListItem";
import { useNavigate } from "react-router-dom";

interface NotesTableProps {
  notes: Note[] | undefined;
  selectedNotes: Note[];
  onSelectAll: () => void;
  toggleNoteSelection: (note: Note) => void;
}

export const NotesTable = ({
  notes,
  selectedNotes,
  onSelectAll,
  toggleNoteSelection,
}: NotesTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b text-sm">
            <th className="py-3 pl-6 pr-4 text-left w-16">
              <div className="flex items-center justify-center w-5 h-5 cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}>
                <Checkbox 
                  checked={notes && selectedNotes.length === notes.length}
                  className="w-4 h-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
          {notes?.map((note) => (
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
  );
};
