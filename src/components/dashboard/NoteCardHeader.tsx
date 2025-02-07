import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteCardHeaderProps {
  title: string;
  isSelectionMode: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
}

export const NoteCardHeader = ({
  title,
  isSelectionMode,
  isDropdownOpen,
  setIsDropdownOpen,
}: NoteCardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-start justify-between">
      <CardTitle className="text-xl">{title}</CardTitle>
      {!isSelectionMode && (
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild data-dropdown>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      )}
    </CardHeader>
  );
};