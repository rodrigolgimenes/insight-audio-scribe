import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NoteCardActions } from "./NoteCardActions";

interface NoteCardHeaderProps {
  title: string;
  isSelectionMode: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

export const NoteCardHeader = ({
  title,
  isSelectionMode,
  isDropdownOpen,
  setIsDropdownOpen,
  onRename,
  onMove,
  onDelete,
}: NoteCardHeaderProps) => {
  if (isSelectionMode) {
    return (
      <div className="p-6">
        <h3 className="font-semibold text-lg text-gray-900 truncate pr-8">
          {title}
        </h3>
      </div>
    );
  }

  return (
    <div className="p-6 flex items-start justify-between">
      <h3 className="font-semibold text-lg text-gray-900 truncate pr-4 flex-1">
        {title}
      </h3>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            data-dropdown
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <NoteCardActions
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      </DropdownMenu>
    </div>
  );
};