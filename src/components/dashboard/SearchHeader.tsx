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
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4">My Recordings</h1>
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input 
          type="search" 
          placeholder="Search recordings..." 
          className="pl-10 h-12 text-lg rounded-xl border-gray-200 focus:border-primary focus:ring-primary shadow-sm"
        />
      </div>
    </div>
  );
};