
import { Search, Mic, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RecordingSheet } from "@/components/dashboard/RecordingSheet";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  return (
    <div className="bg-[#9b87f5] p-4 shadow-md">
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
        <Sheet open={isRecordingSheetOpen} onOpenChange={setIsRecordingSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="bg-[#7E69AB] hover:bg-[#7E69AB] text-white transition-colors"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <RecordingSheet />
        </Sheet>
        <Button 
          onClick={() => navigate('/app/record')}
          className="bg-white text-[#9b87f5] hover:bg-[#E8F0FE] transition-colors"
        >
          <PlusSquare className="h-4 w-4 mr-2" />
          TRANSCRIBE FILES
        </Button>
      </div>
    </div>
  );
};
