
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
  
  // Get pending tasks that haven't been checked recently
  const { data: tasks, error: tasksError } = await supabase
    .from('transcription_tasks')
    .select('id, note_id, recording_id, task_id, retries, created_at')
    .eq('status', 'pending')
    .lt('retries', MAX_RETRIES)
    .lt('last_checked_at', new Date(Date.now() - (RETRY_DELAY_MINUTES * 60 * 1000)).toISOString())
    .order('created_at', { ascending: true })
    .limit(MAX_TASKS_PER_RUN);
    
  if (tasksError) {
    console.error('Error fetching pending tasks:', tasksError);
    return { success: 0, failed: 0, pending: 0 };
  }
  
  console.log(`Found ${tasks?.length || 0} pending transcription tasks to process`);
  
  // Stats counters
  const results = {
    success: 0,
    failed: 0,
    pending: tasks?.length || 0,
  };
  
  // Process each task
  for (const task of tasks || []) {
    try {
      // Update the last checked timestamp
      await supabase
        .from('transcription_tasks')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', task.id);
      
      // Check status with the transcription service
      const taskStatusUrl = `${TRANSCRIPTION_SERVICE_URL}/api/tasks/${task.task_id}`;
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
      console.log(`Task ${task.task_id} status:`, taskStatus);
      
      // Handle completed task
      if (taskStatus.status === 'completed') {
        // Update the task in the database
        await supabase
          .from('transcription_tasks')
          .update({
            status: 'completed',
            content: taskStatus.result?.text || '',
            processed_at: new Date().toISOString(),
            duration_ms: taskStatus.duration_ms
          })
          .eq('id', task.id);
        
        // Update the note with the transcription
        await supabase
          .from('notes')
          .update({
            status: 'generating_minutes',
            processing_progress: 80,
            original_transcript: taskStatus.result?.text || ''
          })
          .eq('id', task.note_id);
          
        // Update the recording with the transcription
        if (task.recording_id) {
          await supabase
            .from('recordings')
            .update({
              status: 'completed',
              transcription: taskStatus.result?.text || ''
            })
            .eq('id', task.recording_id);
        }
        
        // Start meeting minutes generation
        try {
          await supabase.functions.invoke('generate-meeting-minutes', {
            body: {
              noteId: task.note_id,
              transcript: taskStatus.result?.text || ''
            }
          });
          
          console.log(`Started meeting minutes generation for note ${task.note_id}`);
        } catch (minutesError) {
          console.error('Error starting meeting minutes generation:', minutesError);
          
          // Mark note as completed even if minutes generation fails
          await supabase
            .from('notes')
            .update({
              status: 'completed',
              processing_progress: 100
            })
            .eq('id', task.note_id);
        }
        
        results.success++;
      } 
      // Handle failed task
      else if (taskStatus.status === 'failed') {
        await supabase
          .from('transcription_tasks')
          .update({
            status: 'failed',
            error_message: taskStatus.error || 'Transcription failed',
            processed_at: new Date().toISOString(),
            retries: task.retries + 1
          })
          .eq('id', task.id);
          
        await supabase
          .from('notes')
          .update({
            status: 'error',
            error_message: taskStatus.error || 'Transcription failed'
          })
          .eq('id', task.note_id);
          
        if (task.recording_id) {
          await supabase
            .from('recordings')
            .update({
              status: 'error',
              error_message: taskStatus.error || 'Transcription failed'
            })
            .eq('id', task.recording_id);
        }
        
        results.failed++;
      } 
      // Handle in-progress tasks
      else if (taskStatus.status === 'processing') {
        await supabase
          .from('transcription_tasks')
          .update({
            retries: task.retries + 1
          })
          .eq('id', task.id);
          
        // Update note progress to show activity
        await supabase
          .from('notes')
          .update({
            status: 'transcribing',
            processing_progress: 30 + Math.min(task.retries * 10, 40)
          })
          .eq('id', task.note_id);
      }
      
    } catch (error) {
      console.error(`Error processing task ${task.task_id}:`, error);
      
      await supabase
        .from('transcription_tasks')
        .update({
          retries: task.retries + 1,
          error_message: error.message
        })
        .eq('id', task.id);
        
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
