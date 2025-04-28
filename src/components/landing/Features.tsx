
import { AudioWaveform, FileText, ListChecks, ChartBar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Features = () => {
  return (
    <section id="features" className="py-16 bg-ghost-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything you need to stay informed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Transcription</h3>
              <p className="text-gray-600">
                Accurate transcription with speaker detection and noise reduction.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <ListChecks className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Key Points Summary</h3>
              <p className="text-gray-600">
                AI-generated summaries highlighting decisions and action items.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <ChartBar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Context Awareness</h3>
              <p className="text-gray-600">
                Smart insights based on previous meetings and internal documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
