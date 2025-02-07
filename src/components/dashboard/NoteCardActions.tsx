import { Pencil, FolderOpen, Trash2 } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
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

interface NoteCardActionsProps {
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  setIsDropdownOpen: (open: boolean) => void;
}

export const NoteCardActions = ({
  onRename,
  onMove,
  onDelete,
  setIsDropdownOpen,
}: NoteCardActionsProps) => {
  return (
    <DropdownMenuContent 
      align="end" 
      className="w-[160px]"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenuItem 
        onClick={(e) => {
          e.stopPropagation();
          onRename();
          setIsDropdownOpen(false);
        }}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Renomear
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={(e) => {
          e.stopPropagation();
          onMove();
          setIsDropdownOpen(false);
        }}
      >
        <FolderOpen className="mr-2 h-4 w-4" />
        Mover
      </DropdownMenuItem>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <DropdownMenuItem 
            className="text-red-600" 
            onSelect={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenuContent>
  );
};