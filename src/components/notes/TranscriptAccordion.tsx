
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TranscriptAccordionProps {
  transcript: string | null;
  noteId?: string;
}

export const TranscriptAccordion = ({ transcript, noteId }: TranscriptAccordionProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTranscript, setLocalTranscript] = useState<string | null>(transcript);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Update local state when props change
  useEffect(() => {
    setLocalTranscript(transcript);
  }, [transcript]);
  
  console.log('TranscriptAccordion - Transcript data received:', {
    hasTranscript: !!transcript,
    transcriptLength: transcript?.length,
    transcriptPreview: transcript?.substring(0, 100),
    transcriptType: typeof transcript,
    isEmptyOrWhitespace: !transcript?.trim(),
    noteId
  });

  // Handle case where transcript might be null or empty
  const hasValidTranscript = localTranscript && localTranscript.trim() !== '';
  
  const handleRefreshTranscript = async () => {
    if (!noteId) return;
    
    setIsRefreshing(true);
    try {
      // First check if there are transcription chunks available
      const { data: chunksData, error: chunksError } = await supabase
        .from('transcription_chunks')
        .select('count(*)', { count: 'exact' })
        .eq('note_id', noteId);
        
      if (chunksError) {
        console.error('Error checking for transcription chunks:', chunksError);
      } else if (chunksData && typeof chunksData === 'object' && 'count' in chunksData && chunksData.count > 0) {
        console.log(`Found ${chunksData.count} transcription chunks for note ${noteId}`);
        
        // Attempt to concatenate chunks
        try {
          const { data: noteTotalChunks } = await supabase
            .from('notes')
            .select('total_chunks')
            .eq('id', noteId)
            .single();
            
          if (noteTotalChunks?.total_chunks) {
            // Invoke edge function to concatenate chunks
            const { data: concatenatedData, error: concatenateError } = await supabase.functions
              .invoke('process-recording', {
                body: { 
                  noteId: noteId,
                  action: 'concatenate-chunks',
                  totalChunks: noteTotalChunks.total_chunks
                },
              });
              
            if (concatenateError) {
              throw concatenateError;
            }
            
            if (concatenatedData?.transcript) {
              setLocalTranscript(concatenatedData.transcript);
              toast({
                title: "Success",
                description: "Transcription chunks have been combined successfully.",
              });
              queryClient.invalidateQueries({ queryKey: ['note', noteId] });
              return;
            }
          }
        } catch (concatenateError) {
          console.error('Error concatenating transcription chunks:', concatenateError);
        }
      }
      
      // First check if there's a meeting minutes for this note
      const { data: minutesData } = await supabase
        .from('meeting_minutes')
        .select('content')
        .eq('note_id', noteId)
        .maybeSingle();
        
      if (minutesData?.content && (!localTranscript || localTranscript.trim() === '')) {
        console.log("Found meeting minutes but no transcript - this is inconsistent, fetching recording data");
      }
      
      // Fetch the latest transcription directly from the database
      const { data, error } = await supabase
        .from('notes')
        .select('original_transcript, recording_id')
        .eq('id', noteId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data?.original_transcript) {
        // If note already has transcript, use it
        setLocalTranscript(data.original_transcript);
        
        // Invalidate the query to force a refresh
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        toast({
          title: "Success",
          description: "Transcript has been refreshed.",
        });
      } else if (data?.recording_id) {
        // Try to force a re-sync with the recording data
        const { data: recordingData, error: recordingError } = await supabase
          .from('recordings')
          .select('transcription')
          .eq('id', data.recording_id)
          .single();
          
        if (recordingError) {
          throw recordingError;
        }
        
        if (recordingData?.transcription) {
          // If recording has transcript but note doesn't, sync them
          await supabase
            .from('notes')
            .update({
              original_transcript: recordingData.transcription,
              status: 'completed',
              processing_progress: 100
            })
            .eq('id', noteId);
            
          setLocalTranscript(recordingData.transcription);
          queryClient.invalidateQueries({ queryKey: ['note', noteId] });
          toast({
            title: "Success",
            description: "Transcript has been synchronized from recording data.",
          });
        } else {
          // Try alternative ways to fetch the transcript
          const { data: fullRecording } = await supabase
            .from('recordings')
            .select('*')
            .eq('id', data.recording_id)
            .single();
            
          console.log('Full recording data:', fullRecording);
          
          if (fullRecording?.status === 'completed' && !fullRecording.transcription) {
            toast({
              title: "Inconsistent state detected",
              description: "Recording is marked as completed but has no transcript. Fixing...",
            });
            
            // Force a retry of the transcription process
            try {
              await supabase.functions.invoke('transcribe-audio', {
                body: { 
                  noteId,
                  recordingId: data.recording_id,
                  isRetry: true
                }
              });
              
              toast({
                title: "Transcription restarted",
                description: "Check back in a few moments for the transcript.",
              });
            } catch (invokeError) {
              console.error('Error invoking transcribe function:', invokeError);
            }
          } else {
            toast({
              title: "No transcript available",
              description: "No transcript was found in the recording or note.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing transcript:', error);
      toast({
        title: "Error",
        description: "Failed to refresh transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!hasValidTranscript && !noteId) {
    console.log('TranscriptAccordion - Invalid or empty transcript and no noteId');
    return null;
  }
  
  return (
    <Accordion type="single" collapsible className="w-full mt-8">
      <AccordionItem value="transcript" className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <span>Original Transcription</span>
              {!hasValidTranscript && <span className="text-sm font-normal text-amber-600">(Not available)</span>}
            </h2>
            <ChevronDown className="h-5 w-5 text-gray-500 shrink-0 transition-transform duration-200" />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-gray-50 p-6 rounded-b-lg">
            <p className="text-sm text-gray-500 mb-4 italic">
              This is the automated transcription. It may contain errors.
            </p>
            
            {hasValidTranscript ? (
              <div className="whitespace-pre-wrap text-gray-700 max-h-[500px] overflow-y-auto prose prose-sm">
                {localTranscript}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-500">Transcript is not available or still processing.</p>
                {noteId && (
                  <Button 
                    onClick={handleRefreshTranscript} 
                    disabled={isRefreshing}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Transcript'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
