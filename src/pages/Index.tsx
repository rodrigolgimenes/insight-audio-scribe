
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { RecordingModal } from "@/components/record/RecordingModal";
import { Header } from "@/components/Header";
import { PricingSection } from "@/components/payments/PricingSection";
import { UploadSection } from "@/components/landing/UploadSection";

export default function Index() {
  const [isRecordingModalOpen, setIsRecordingModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-col">
        <section className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Transform Your Voice Into Text
            </h1>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Record audio and instantly get transcribed notes with our advanced voice recognition technology.
            </p>
            <Button
              onClick={() => setIsRecordingModalOpen(true)}
              className="bg-[#4285F4] hover:bg-[#3367D6] active:bg-[#2A56C6] text-white"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Record Audio
            </Button>
          </div>

          <RecordingModal
            isOpen={isRecordingModalOpen}
            onOpenChange={setIsRecordingModalOpen}
          />
        </section>
        
        {/* Add upload section between hero and pricing */}
        <UploadSection />
        
        {/* Pricing section */}
        <PricingSection />
      </main>
    </div>
  );
}
