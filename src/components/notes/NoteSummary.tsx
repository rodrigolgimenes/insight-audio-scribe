
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface NoteSummaryProps {
  noteId: string;
}

export function NoteSummary({ noteId }: NoteSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSummary = async () => {
    setIsLoading(true);
    // This is a placeholder for actual summary generation
    // In a real implementation, this would call an API endpoint
    try {
      // Simulating API call with timeout
      setTimeout(() => {
        setSummary("This is a placeholder summary of the note content. In a real implementation, this would be generated based on the note's content using AI.");
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error generating summary:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Note Summary</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={generateSummary}
          disabled={isLoading}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? 'Generating...' : 'Generate Summary'}
        </Button>
      </div>

      {summary ? (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-700">{summary}</p>
        </Card>
      ) : (
        <div className="text-center py-6 border rounded-md bg-gray-50">
          <p className="text-gray-500">No summary generated yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Generate Summary" to create one</p>
        </div>
      )}
    </div>
  );
}
