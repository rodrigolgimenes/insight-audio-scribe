import { Note } from "@/types/notes";

interface NoteListProps {
  notes: Note[];
  onSelect: (note: Note) => void;
  selectedNotes: Note[];
}

export const NoteList = ({ notes, onSelect, selectedNotes }: NoteListProps) => {
  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id} className="border rounded p-4">
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <div className="mt-2 text-gray-600 line-clamp-2">
            {note.processed_content}
          </div>
          <button
            onClick={() => onSelect(note)}
            className={`mt-2 text-sm ${selectedNotes.includes(note) ? 'text-blue-500' : 'text-gray-500'}`}
          >
            {selectedNotes.includes(note) ? 'Deselect' : 'Select'}
          </button>
        </div>
      ))}
    </div>
  );
};
