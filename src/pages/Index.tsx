
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { RecordingModal } from "@/components/record/RecordingModal";

export default function Index() {
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Button
            onClick={() => setIsRecordingModalOpen(true)}
            className="bg-[#E91E63] hover:bg-[#D81B60] text-white"
          >
            <Mic className="w-5 h-5 mr-2" />
            Record Audio
          </Button>
        </div>
      </main>

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onOpenChange={setIsRecordingModalOpen}
      />
    </div>
  );
}
