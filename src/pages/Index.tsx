
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="max-w-3xl text-center px-4">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">
          Audio Recording App
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          A powerful tool for recording, transcribing, and managing your audio notes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link to="/simple-record">
              Go to Recording Page
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link to="/app">
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
