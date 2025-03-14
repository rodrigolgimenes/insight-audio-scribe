
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, AlertCircle, Clock, Info, FileAudio2, FileVideo2 } from "lucide-react";

interface ProcessingLog {
  id: string;
  recording_id: string;
  note_id: string | null;
  timestamp: string;
  stage: string;
  message: string;
  status: 'info' | 'warning' | 'error' | 'success';
  details?: any;
  visible_to_user?: boolean;
}

interface ProcessingLogsProps {
  recordingId?: string;
  noteId?: string;
  maxHeight?: string;
}

const stageIcons: Record<string, JSX.Element> = {
  extraction_started: <FileVideo2 className="h-4 w-4" />,
  retrieve_file: <FileVideo2 className="h-4 w-4" />,
  download_file: <FileVideo2 className="h-4 w-4" />,
  audio_extraction: <FileAudio2 className="h-4 w-4" />,
  upload_audio: <FileAudio2 className="h-4 w-4" />,
  retrieve_audio: <FileAudio2 className="h-4 w-4" />,
  transcription_start: <Clock className="h-4 w-4" />,
  extraction_error: <AlertCircle className="h-4 w-4" />,
  file_uploaded: <FileVideo2 className="h-4 w-4" />,
};

const statusIcons: Record<string, JSX.Element> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
  success: <Check className="h-4 w-4 text-green-500" />,
};

export const ProcessingLogs = ({ recordingId, noteId, maxHeight = "300px" }: ProcessingLogsProps) => {
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Calculate an estimated progress based on the stages completed
  const calculateProgress = (logs: ProcessingLog[]) => {
    if (logs.length === 0) return 0;
    
    const stages = [
      'file_uploaded',
      'extraction_started',
      'retrieve_file',
      'download_file',
      'audio_extraction',
      'upload_audio',
      'retrieve_audio',
      'transcription_start'
    ];
    
    // Check for errors
    if (logs.some(log => log.status === 'error')) {
      return -1; // Indicates an error state
    }
    
    // Find the latest stage completed successfully
    const completedStages = stages.filter(stage => 
      logs.some(log => log.stage === stage && log.status === 'success')
    );
    
    return Math.round((completedStages.length / stages.length) * 100);
  };

  // Fetch existing logs on load
  useEffect(() => {
    const fetchLogs = async () => {
      if (!recordingId && !noteId) return;
      
      setLoading(true);
      
      let query = supabase
        .from('processing_logs')
        .select('*');
        
      if (recordingId) {
        query = query.eq('recording_id', recordingId);
      } else if (noteId) {
        query = query.eq('note_id', noteId);
      }
      
      const { data, error } = await query.order('timestamp', { ascending: true });
      
      if (error) {
        console.error('Error fetching processing logs:', error);
      } else if (data) {
        setLogs(data as ProcessingLog[]);
        const calculatedProgress = calculateProgress(data as ProcessingLog[]);
        setProgress(calculatedProgress >= 0 ? calculatedProgress : 0);
      }
      
      setLoading(false);
    };
    
    fetchLogs();
  }, [recordingId, noteId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!recordingId && !noteId) return;
    
    // Define the filter based on what's available
    let filter = '';
    if (recordingId) {
      filter = `recording_id=eq.${recordingId}`;
    } else if (noteId) {
      filter = `note_id=eq.${noteId}`;
    } else {
      return;
    }
    
    // Subscribe to changes
    const channel = supabase
      .channel('processing-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processing_logs',
          filter
        },
        (payload) => {
          const newLog = payload.new as ProcessingLog;
          console.log('New processing log received:', newLog);
          
          setLogs(prevLogs => {
            const newLogs = [...prevLogs, newLog];
            const calculatedProgress = calculateProgress(newLogs);
            setProgress(calculatedProgress >= 0 ? calculatedProgress : 0);
            return newLogs;
          });
        }
      )
      .subscribe();
    
    console.log(`Subscribed to processing logs changes with filter: ${filter}`);
    
    return () => {
      console.log('Unsubscribing from processing logs channel');
      supabase.removeChannel(channel);
    };
  }, [recordingId, noteId]);

  if ((!recordingId && !noteId) || (logs.length === 0 && !loading)) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-base">Processing Logs</CardTitle>
          {progress > 0 && (
            <div className="text-xs text-muted-foreground">
              {progress}% Complete
            </div>
          )}
        </div>
        
        {progress > 0 && (
          <Progress 
            value={progress} 
            className="h-2 mb-4" 
          />
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`p-2 text-sm border-l-2 rounded ${
                    log.status === 'error' ? 'border-red-500 bg-red-50' :
                    log.status === 'warning' ? 'border-amber-500 bg-amber-50' :
                    log.status === 'success' ? 'border-green-500 bg-green-50' :
                    'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-2">
                      {statusIcons[log.status] || stageIcons[log.stage] || <Info className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{log.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(log.timestamp)} - {log.stage.replace(/_/g, ' ')}
                      </div>
                      {log.details && (
                        <div className="mt-1 text-xs text-muted-foreground overflow-hidden text-ellipsis">
                          {typeof log.details === 'object' 
                            ? Object.entries(log.details)
                                .filter(([key, value]) => key !== 'error' && key !== 'publicUrl' && key !== 'url')
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')
                            : log.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
