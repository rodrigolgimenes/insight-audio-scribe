
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isRecordingSheetOpen: boolean;
  setIsRecordingSheetOpen: (isOpen: boolean) => void;
}

export const DashboardHeader = ({
  searchQuery,
  setSearchQuery,
  isRecordingSheetOpen,
  setIsRecordingSheetOpen
}: DashboardHeaderProps) => {
  return (
    <div className="bg-palatinate-blue p-4 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center flex-1 max-w-2xl bg-white rounded-lg overflow-hidden">
          <Search className="h-5 w-5 ml-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 h-10"
          />
        </div>
      </div>
    </div>
  );
};
