
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TranscriptionStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  progress?: number;
  error?: string;
}

export const TranscriptionStatus: React.FC<TranscriptionStatusProps> = ({
  status,
  progress = 0,
  error
}) => {
  const getStatusIcon = () => {
    switch(status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch(status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="font-medium">Transcription: {getStatusText()}</h3>
        </div>
        
        {status === 'processing' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
          </div>
        )}
        
        {(status === 'failed' || status === 'error') && error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
