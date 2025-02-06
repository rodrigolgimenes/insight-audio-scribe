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
    <div className="space-y-6 mb-8">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input 
          type="search" 
          placeholder="Search notes..." 
          className="pl-10 h-12 text-lg rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            note
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            tasklist
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            Select notes
          </span>
          <Switch 
            checked={isSelectionMode} 
            onCheckedChange={setIsSelectionMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </div>
  );
};