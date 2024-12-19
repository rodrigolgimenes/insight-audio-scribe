import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import html2pdf from "html2pdf.js";

interface ProcessedContentProps {
  title: string;
  content: string;
  originalTranscript: string;
  onReprocess: () => void;
  isProcessing: boolean;
}

export const ProcessedContent = ({ 
  title, 
  content, 
  originalTranscript,
  onReprocess,
  isProcessing 
}: ProcessedContentProps) => {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const handleCopyContent = async () => {
    await navigator.clipboard.writeText(content);
  };

  const handleCopyTranscript = async () => {
    await navigator.clipboard.writeText(originalTranscript);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('processed-content');
    html2pdf()
      .set({
        margin: 1,
        filename: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      })
      .from(element)
      .save();
  };

  return (
    <div className="space-y-8">
      <div id="processed-content" className="space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleCopyContent} variant="outline" className="gap-2">
            <Copy className="w-4 h-4" />
            Copy Result
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button 
            onClick={onReprocess} 
            variant="outline" 
            className="gap-2"
            disabled={isProcessing}
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Try Another Style
          </Button>
        </div>

        <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      <div className="border-t pt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Original Transcript</h2>
          <Button onClick={handleCopyTranscript} variant="ghost" size="sm" className="gap-2">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-4">
            This is the automated transcription. It may contain errors.
          </p>
          <div className={`whitespace-pre-wrap ${!showFullTranscript && 'line-clamp-6'}`}>
            {originalTranscript}
          </div>
          {originalTranscript.split('\n').length > 6 && (
            <Button
              variant="link"
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              className="mt-2"
            >
              {showFullTranscript ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};