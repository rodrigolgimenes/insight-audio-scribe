import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface RecordHeaderProps {
  onBack: () => void;
}

export const RecordHeader = ({ onBack }: RecordHeaderProps) => {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
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
  );
};