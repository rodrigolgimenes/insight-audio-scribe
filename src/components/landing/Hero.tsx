
import { Button } from "@/components/ui/button";
import { ArrowRight, AudioWaveform } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const handleStartFreeTrial = () => {
    navigate("/login");
  };

  return (
    <section className="pt-32 pb-16 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Never Miss a Meeting
              <span className="text-primary block">Insight Again</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform your meetings into actionable insights with AI-powered transcription and
              summarization. Stay informed without being present.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-dark text-white"
                onClick={handleStartFreeTrial}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="bg-primary-light p-8 rounded-2xl animate-float">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Record Meeting</h3>
                <span className="text-gray-500">00:00</span>
              </div>
              <Button className="w-full bg-primary hover:bg-primary-dark text-white mb-4">
                <AudioWaveform className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
              <div className="text-center text-gray-500">
                or drag and drop audio file here
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
