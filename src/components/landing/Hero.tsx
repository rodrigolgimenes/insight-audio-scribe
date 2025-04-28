
import { Button } from "@/components/ui/button";
import { ArrowRight, AudioWaveform } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

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
              <span className="text-blue-600">Never Miss a Meeting</span>
              <span className="block text-gray-800">Insight Again</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform your meetings into actionable insights with AI-powered transcription and
              summarization. Stay informed without being present.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleStartFreeTrial}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                asChild
              >
                <Link to="/simple-record">
                  Try Recording
                </Link>
              </Button>
            </div>
          </div>
          <div className="bg-blue-50 p-8 rounded-2xl shadow-lg transform hover:-translate-y-1 transition-all duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Record Meeting</h3>
                <span className="text-gray-500">00:00</span>
              </div>
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white mb-4"
                asChild
              >
                <Link to="/simple-record">
                  <AudioWaveform className="mr-2 h-5 w-5" />
                  Start Recording
                </Link>
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
};
