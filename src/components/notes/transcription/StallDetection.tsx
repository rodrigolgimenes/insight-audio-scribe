
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StallDetectionProps {
  status: string;
  noteId?: string;
  onStallDetected: (isStalled: boolean) => void;
  onLastProgressUpdate: (date: Date | null) => void;
}

export const StallDetection: React.FC<StallDetectionProps> = ({
  status,
  noteId,
  onStallDetected,
  onLastProgressUpdate
}) => {
  useEffect(() => {
    if (!noteId || !(status === 'processing' || status === 'transcribing' || status === 'pending')) {
      onStallDetected(false);
      return;
    }
    
    // Start a timer to detect stalled transcriptions
    const checkTimeoutId = setTimeout(() => {
      // Check if the note's status has been updated
      const checkStatus = async () => {
        console.log('Checking note status for inactivity...');
        const { data } = await supabase
          .from('notes')
          .select('updated_at, processing_progress, status')
          .eq('id', noteId)
          .single();
          
        if (data) {
          const lastUpdate = new Date(data.updated_at);
          const now = new Date();
          const timeSinceUpdate = now.getTime() - lastUpdate.getTime();
          
          // If no update for 5 minutes (300000ms) and still in processing state
          if (timeSinceUpdate > 300000) {
            console.log('Transcription seems stalled (no updates for 5+ minutes)');
            onStallDetected(true);
          } else {
            onLastProgressUpdate(lastUpdate);
            console.log('Transcription still active, last update:', 
              Math.round(timeSinceUpdate / 1000 / 60), 'minutes ago');
          }
        }
      };
      
      checkStatus();
    }, 300000); // Check after 5 minutes
    
    return () => clearTimeout(checkTimeoutId);
  }, [status, noteId, onStallDetected, onLastProgressUpdate]);
  
  return null; // This is a non-visual component
};
