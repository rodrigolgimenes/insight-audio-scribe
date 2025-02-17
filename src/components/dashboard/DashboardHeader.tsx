import { Search, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { RecordingSheet } from "@/components/record/RecordingSheet";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isRecordingSheetOpen: boolean;
  setIsRecordingSheetOpen: (open: boolean) => void;
}

export const DashboardHeader = ({
  searchQuery,
  setSearchQuery,
  isRecordingSheetOpen,
  setIsRecordingSheetOpen,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-primary p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center flex-1 max-w-2xl bg-white rounded-lg">
          <Search className="h-5 w-5 ml-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0"
          />
        </div>
        <Sheet open={isRecordingSheetOpen} onOpenChange={setIsRecordingSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="bg-primary-dark hover:bg-primary-dark/90 text-white"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <RecordingSheet onOpenChange={setIsRecordingSheetOpen} />
        </Sheet>
        <Button 
          onClick={() => navigate('/app/record')}
          className="bg-primary-light text-primary hover:bg-primary-light/90"
        >
          TRANSCRIBE FILES
        </Button>
      </div>
    </div>
  );
};
