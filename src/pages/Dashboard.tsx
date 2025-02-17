
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { RecordingModal } from "@/components/record/RecordingModal";

export default function Dashboard() {
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Fixed Recording Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsRecordingModalOpen(true)}
          variant="outline"
          size="icon"
          className="w-12 h-12 bg-[#9b87f5] hover:bg-[#7E69AB] text-white border-none shadow-lg transition-all duration-200 ease-in-out"
        >
          <Mic className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button
          onClick={() => setIsRecordingModalOpen(true)}
          className="bg-[#E91E63] hover:bg-[#D81B60] text-white gap-2"
        >
          <Mic className="h-5 w-5" />
          Record Audio
        </Button>
      </div>

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onOpenChange={setIsRecordingModalOpen}
      />
    </div>
  );
}
