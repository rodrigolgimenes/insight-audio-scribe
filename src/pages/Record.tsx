import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Play, Trash, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-white">
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
            <Button variant="outline">Upload</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold gradient-text">InsightScribe</h1>
          </div>

          {/* Recording Status */}
          <div className="mb-8">
            <span className="inline-flex items-center text-gray-600">
              <span className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
              {isRecording ? 'Recording...' : 'Recording off'}
            </span>
          </div>

          {/* Waveform Visualization */}
          <div className="h-32 mb-8 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="w-full max-w-md h-1 bg-blue-500 rounded"></div>
          </div>

          {/* Timer */}
          <div className="mb-12">
            <div className="text-4xl font-bold mb-2">{timer}</div>
            <div className="text-sm text-gray-500">Limit: 20:00</div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button
              size="icon"
              variant="secondary"
              className="w-12 h-12 rounded-full"
            >
              <Play className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="default"
              className="w-16 h-16 rounded-full bg-primary hover:bg-primary-dark"
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className="w-8 h-8" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="w-12 h-12 rounded-full"
            >
              <Trash className="w-6 h-6" />
            </Button>
          </div>

          {/* Settings and Create Note */}
          <div className="flex flex-col items-center gap-4">
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button className="bg-primary hover:bg-primary-dark gap-2">
              Create note
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Record;