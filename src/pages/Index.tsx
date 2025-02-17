
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { RecordingModal } from "@/components/record/RecordingModal";

export default function Index() {
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
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

        <RecordingModal
          isOpen={isRecordingModalOpen}
          onOpenChange={setIsRecordingModalOpen}
        />
      </main>
    </div>
  );
}
