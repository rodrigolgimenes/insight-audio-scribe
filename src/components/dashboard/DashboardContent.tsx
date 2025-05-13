
import { Note } from "@/types/notes";
import { DashboardTable } from "./DashboardTable";
import { PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardContentProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  handleSelectAll: () => void;
  toggleNoteSelection: (note: Note) => void;
}

export const DashboardContent = ({
  notes,
  isLoading,
  isSelectionMode,
  selectedNotes,
  handleSelectAll,
  toggleNoteSelection,
}: DashboardContentProps) => {
  const navigate = useNavigate();

  if (!notes && !isLoading) {
    return (
      <div className="text-center py-12">
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <DashboardTable
        notes={notes}
        isLoading={isLoading}
        isSelectionMode={isSelectionMode}
        selectedNotes={selectedNotes}
        onSelectAll={handleSelectAll}
        onToggleNoteSelection={toggleNoteSelection}
      />
    </div>
  );
};
