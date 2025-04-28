
import { AudioWaveform, FileText, ListChecks, ChartBar, Brain, Clock, Filter, Lock } from "lucide-react";

export const Features = () => {
  return (
    <section id="features" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything you need to stay informed
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <FileText className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Transcription</h3>
            <p className="text-gray-600">
              Accurate transcription with speaker detection and noise reduction.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <ListChecks className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Key Points Summary</h3>
            <p className="text-gray-600">
              AI-generated summaries highlighting decisions and action items.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <Brain className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">
              Chat with your meeting data to extract specific information.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <Clock className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Time-Saving</h3>
            <p className="text-gray-600">
              Save hours by skipping meetings and reviewing summaries instead.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <ChartBar className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Context Awareness</h3>
            <p className="text-gray-600">
              Smart insights based on previous meetings and internal documents.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <Filter className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Noise Filtering</h3>
            <p className="text-gray-600">
              Advanced algorithms to remove background noise from recordings.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <Lock className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
            <p className="text-gray-600">
              End-to-end encryption for all your sensitive meeting data.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <AudioWaveform className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Audio Enhancement</h3>
            <p className="text-gray-600">
              Improve audio quality for better transcription results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
