import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchHeaderProps {
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
}

export const SearchHeader = ({
  isSelectionMode,
  setIsSelectionMode,
}: SearchHeaderProps) => {
  return (
    <>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input type="search" placeholder="Search notes..." className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-4 mb-8">
        <div className="flex gap-2">
          <Badge variant="secondary">note</Badge>
          <Badge variant="secondary">tasklist</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Select notes</span>
          <Switch checked={isSelectionMode} onCheckedChange={setIsSelectionMode} />
        </div>
      </div>
    </>
  );
};