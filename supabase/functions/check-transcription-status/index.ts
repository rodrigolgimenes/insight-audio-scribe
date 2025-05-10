
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
      const { data: notes } = await supabase
        .from('notes')
        .select('id')
        .eq('recording_id', recording.id);
        
      if (!notes || notes.length === 0) {
        console.error(`No note found for recording ${recording.id}`);
        continue;
      }
      
      const noteId = notes[0].id;
      const taskId = recording.task_id;
      
      if (!taskId) {
        console.error(`No task_id for recording ${recording.id}`);
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
        throw new Error(`Failed to check task status: ${response.status} ${response.statusText}`);
      }
      
      const taskStatus = await response.json();
      console.log(`Task ${taskId} status:`, taskStatus);
      
      // Handle completed task
      if (taskStatus.status === 'completed') {
        // Update the recording with the transcription result
        await supabase
          .from('recordings')
          .update({
            transcription: taskStatus.result?.text || '',
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', recording.id);
        
        // Update the note with the transcription
        await supabase
          .from('notes')
          .update({
            status: 'generating_minutes',
            processing_progress: 80,
            original_transcript: taskStatus.result?.text || ''
          })
          .eq('id', noteId);
        
        // Start meeting minutes generation
        try {
          await supabase.functions.invoke('generate-meeting-minutes', {
            body: {
              noteId: noteId,
              transcript: taskStatus.result?.text || ''
            }
          });
          
          console.log(`Started meeting minutes generation for note ${noteId}`);
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
        }
        
        results.success++;
      } 
      // Handle failed task
      else if (taskStatus.status === 'failed') {
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
      else if (taskStatus.status === 'processing') {
        // Update note progress to show activity
        await supabase
          .from('notes')
          .update({
            status: 'transcribing',
            processing_progress: Math.min(30 + Math.floor(Math.random() * 40), 70) // Random progress between 30-70%
          })
          .eq('id', noteId);
      }
    } catch (error) {
      console.error(`Error processing task for recording ${recording.id}:`, error);
      results.failed++;
    }
  }
  
  return results;
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
        message: `Processed ${results.pending} tasks: ${results.success} succeeded, ${results.failed} failed`,
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
