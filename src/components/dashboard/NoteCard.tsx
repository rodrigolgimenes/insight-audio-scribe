import { Note } from "@/integrations/supabase/types/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, CheckSquare, MoreVertical, Pencil, FolderOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteDuration } from "./NoteDuration";
import { formatDate } from "@/utils/formatDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MoveNoteDialog } from "@/components/notes/MoveNoteDialog";
import { useNoteOperations } from "@/components/notes/NoteOperations";

interface NoteCardProps {
  note: Note;
  isSelectionMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const NoteCard = ({ note, isSelectionMode, isSelected, onClick }: NoteCardProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const { deleteNote } = useNoteOperations(note.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Previne a propagação do clique do dropdown para o card
    if (e.target instanceof HTMLElement && e.target.closest('[data-dropdown]')) {
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 relative",
        isSelectionMode && isSelected && "bg-gray-50 ring-2 ring-primary"
      )}
      onClick={handleCardClick}
    >
      {isSelectionMode && (
        <div className="absolute top-4 right-4">
          <CheckSquare 
            className={cn(
              "h-6 w-6",
              isSelected ? "text-primary" : "text-gray-300"
            )} 
          />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-xl">{note.title}</CardTitle>
        {!isSelectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Mover
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir nota</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteNote}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
          <NoteDuration duration={note.duration} />
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(note.created_at)}
          </span>
        </div>
      </CardContent>

      {/* Diálogo para mover a nota */}
      <MoveNoteDialog
        isOpen={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        folders={[]} // Será preenchido com as pastas disponíveis
        currentFolderId={null}
        onMoveToFolder={(folderId) => {
          // Implementar a lógica de mover para pasta
          setIsMoveDialogOpen(false);
        }}
      />
    </Card>
  );
};