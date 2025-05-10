
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "./utils.ts";

const TRANSCRIPTION_SERVICE_URL = Deno.env.get('TRANSCRIPTION_SERVICE_URL') || 'http://167.88.42.2:8001';
const MAX_RETRIES = 5;
const MAX_TASKS_PER_RUN = 10;
const RETRY_DELAY_MINUTES = 2;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processPendingTasks(supabase: any): Promise<{
  success: number;
  failed: number;
  pending: number;
}> {
  console.log('Starting to process pending transcription tasks');
  
  // Get recordings with pending task_ids
  const { data: recordings, error: recordingsError } = await supabase
    .from('recordings')
    .select('id, task_id, title')
    .not('task_id', 'is', null)
    .eq('status', 'transcribing')
    .order('updated_at', { ascending: true })
    .limit(MAX_TASKS_PER_RUN);
    
  if (recordingsError) {
    console.error('Error fetching recordings with tasks:', recordingsError);
    return { success: 0, failed: 0, pending: 0 };
  }
  
  console.log(`Found ${recordings?.length || 0} recordings with pending transcription tasks`);
  
  if (!recordings || recordings.length === 0) {
    console.log('No pending transcription tasks found');
    return { success: 0, failed: 0, pending: 0 };
  }
  
  // Log details of tasks found
  recordings.forEach(rec => {
    console.log(`Processing task for recording: ${rec.id}, Task ID: ${rec.task_id}, Title: ${rec.title}`);
  });
  
  // Stats counters
  const results = {
    success: 0,
    failed: 0,
    pending: recordings?.length || 0,
  };
  
  // Process each recording with a task
  for (const recording of recordings || []) {
    try {
      // Get the associated note
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id')
        .eq('recording_id', recording.id);
        
      if (notesError) {
        console.error(`Error fetching note for recording ${recording.id}:`, notesError);
        results.failed++;
        continue;
      }
        
      if (!notes || notes.length === 0) {
        console.error(`No note found for recording ${recording.id}`);
        results.failed++;
        continue;
      }
      
      const noteId = notes[0].id;
      const taskId = recording.task_id;
      
      if (!taskId) {
        console.error(`No task_id for recording ${recording.id} despite query filter`);
        results.failed++;
        continue;
      }
      
      // Check status with the transcription service
      const taskStatusUrl = `${TRANSCRIPTION_SERVICE_URL}/api/tasks/${taskId}`;
      console.log(`Checking task status: ${taskStatusUrl}`);
      
      const response = await fetch(taskStatusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to check task status: ${response.status} ${response.statusText}`);
        
        // Log the error response body for debugging
        try {
          const errorText = await response.text();
          console.error(`Error response body: ${errorText}`);
        } catch (e) {
          console.error(`Could not read error response body: ${e}`);
        }
        
        results.failed++;
        continue;
      }
      
      const taskStatus = await response.json();
      console.log(`Task ${taskId} status:`, JSON.stringify(taskStatus, null, 2));
      
      // Handle completed task
      if (taskStatus.status === 'completed') {
        // Update the recording with the transcription result
        const transcriptionText = taskStatus.result?.text || '';
        console.log(`Task completed with text of length: ${transcriptionText.length}`);
        
        const { error: recordingUpdateError } = await supabase
          .from('recordings')
          .update({
            transcription: transcriptionText,
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', recording.id);
          
        if (recordingUpdateError) {
          console.error(`Failed to update recording ${recording.id}:`, recordingUpdateError);
          results.failed++;
          continue;
        }
        
        // Update the note with the transcription
        const { error: noteUpdateError } = await supabase
          .from('notes')
          .update({
            status: 'generating_minutes',
            processing_progress: 80,
            original_transcript: transcriptionText
          })
          .eq('id', noteId);
          
        if (noteUpdateError) {
          console.error(`Failed to update note ${noteId}:`, noteUpdateError);
          results.failed++;
          continue;
        }
        
        // Start meeting minutes generation
        try {
          await supabase.functions.invoke('generate-meeting-minutes', {
            body: {
              noteId: noteId,
              transcript: transcriptionText
            }
          });
          
          console.log(`Started meeting minutes generation for note ${noteId}`);
          results.success++;
        } catch (minutesError) {
          console.error('Error starting meeting minutes generation:', minutesError);
          
          // Mark note as completed even if minutes generation fails
          await supabase
            .from('notes')
            .update({
              status: 'completed',
              processing_progress: 100
            })
            .eq('id', noteId);
            
          results.success++; // Still count as success since transcription was completed
        }
      } 
      // Handle failed task
      else if (taskStatus.status === 'failed') {
        console.log(`Task ${taskId} failed with error: ${taskStatus.error || 'Unknown error'}`);
        
        await supabase
          .from('recordings')
          .update({
            status: 'error',
            error_message: taskStatus.error || 'Transcription failed'
          })
          .eq('id', recording.id);
          
        await supabase
          .from('notes')
          .update({
            status: 'error',
            error_message: taskStatus.error || 'Transcription failed'
          })
          .eq('id', noteId);
          
        results.failed++;
      } 
      // Handle in-progress tasks
      else if (taskStatus.status === 'processing' || taskStatus.status === 'queued') {
        console.log(`Task ${taskId} is still ${taskStatus.status}`);
        
        // Update note progress to show activity - use more granular progress for better UX
        const progressValue = taskStatus.status === 'processing' ? 
          Math.min(40 + Math.floor(Math.random() * 30), 70) : // Between 40-70% for processing
          Math.min(30 + Math.floor(Math.random() * 10), 40);  // Between 30-40% for queued
        
        await supabase
          .from('notes')
          .update({
            status: 'transcribing',
            processing_progress: progressValue
          })
          .eq('id', noteId);
          
        // This is neither success nor failure yet
        results.pending++;
      } else {
        console.warn(`Unknown task status for task ${taskId}: ${taskStatus.status}`);
        results.pending++;
      }
    } catch (error) {
      console.error(`Error processing task for recording ${recording.id}:`, error);
      results.failed++;
    }
  }
  
  return {
    success: results.success,
    failed: results.failed,
    pending: results.pending - results.success - results.failed
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();
    
    // Process pending tasks
    const results = await processPendingTasks(supabase);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.pending} tasks: ${results.success} succeeded, ${results.failed} failed, ${results.pending - results.success - results.failed} still pending`,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error in check-transcription-status function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
