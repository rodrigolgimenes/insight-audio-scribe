import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Play, Trash, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/app");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-white">
          {/* Header */}
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <Button variant="outline" className="text-primary">
                  <span className="mr-2">↑</span>
                  Upload
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              {/* Recording Status */}
              <div className="mb-8">
                <span className="inline-flex items-center text-gray-600">
                  <span className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {isRecording ? 'Recording...' : 'Recording off'}
                </span>
              </div>

              {/* Waveform Visualization */}
              <div className="h-32 mb-8 bg-[#F8F9FE] rounded-lg flex items-center justify-center">
                <div className="w-full max-w-md h-1 bg-primary rounded"></div>
              </div>

              {/* Timer */}
              <div className="mb-12">
                <div className="text-4xl font-bold mb-2">{timer}</div>
                <div className="text-sm text-gray-500">Limit: 20:00</div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 mb-12">
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
                >
                  <Play className="w-6 h-6 text-primary" />
                </Button>
                <Button
                  size="icon"
                  variant="default"
                  className="w-20 h-20 rounded-full bg-[#E91E63] hover:bg-[#D81B60]"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  <Mic className="w-10 h-10" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
                >
                  <Trash className="w-6 h-6 text-primary" />
                </Button>
              </div>

              {/* Settings and Create Note */}
              <div className="flex flex-col items-center gap-4">
                <Button variant="outline" className="gap-2 border-2 text-primary">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
                <Button className="bg-[#E91E63] hover:bg-[#D81B60] gap-2">
                  Create note
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Record;