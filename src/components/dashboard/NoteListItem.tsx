
import { Note } from "@/integrations/supabase/types/notes";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, Folder, CheckCircle } from "lucide-react";
import { formatDuration } from "@/utils/formatDuration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

export const NoteListItem = ({ note, isSelected, onSelect, onClick }: NoteListItemProps) => {
  return (
    <tr className="group border-b hover:bg-gray-50 transition-colors">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center justify-center w-5 h-5 cursor-pointer" onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}>
          <Checkbox checked={isSelected} className="w-4 h-4" />
        </div>
      </td>
      <td className="py-4 pl-8 pr-4" onClick={onClick}>
        <div className="flex flex-col">
          {note.folder && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Folder className="h-3 w-3" />
              <span>{note.folder.name}</span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-900">{note.title}</span>
        </div>
      </td>
      <td className="py-4 px-4" onClick={onClick}>
        <span className="text-sm text-gray-500">
          {new Date(note.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </td>
      <td className="py-4 px-4" onClick={onClick}>
        <span className="text-sm text-gray-500">{formatDuration(note.duration || 0)}</span>
      </td>
      <td className="py-4 px-4" onClick={onClick}>
        <span className="text-sm text-gray-500">Auto</span>
      </td>
      <td className="py-4 px-4" onClick={onClick}>
        <div className="flex items-center gap-2">
          <Badge 
            variant={note.status === 'completed' ? 'success' : 
                    note.status === 'error' ? 'destructive' : 
                    'default'}
            className="rounded-full text-xs font-medium px-2 py-0.5"
          >
            {note.status === 'completed' ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Completed</span>
              </div>
            ) : note.status === 'error' ? 'Error' : 'Processing'}
          </Badge>
        </div>
      </td>
      <td className="py-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </Button>
      </td>
    </tr>
  );
};
