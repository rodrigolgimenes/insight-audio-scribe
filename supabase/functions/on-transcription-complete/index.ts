
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[on-transcription-complete] Webhook received');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    const { task_id, status, result, error: transcriptionError } = await req.json();
    
    console.log('[on-transcription-complete] Received data:', { 
      task_id, 
      status, 
      hasResult: !!result, 
      hasError: !!transcriptionError 
    });
    
    if (!task_id) {
      throw new Error('Missing task_id in webhook payload');
    }
    
    // Find the recording with this task_id
    const { data: recording, error: findError } = await supabase
      .from('recordings')
      .select('id, status')
      .eq('task_id', task_id)
      .single();
      
    if (findError) {
      console.error('[on-transcription-complete] Error finding recording:', findError);
      throw new Error(`Failed to find recording with task_id ${task_id}`);
    }
    
    if (!recording) {
      console.error('[on-transcription-complete] No recording found with task_id:', task_id);
      throw new Error(`No recording found with task_id ${task_id}`);
    }
    
    console.log('[on-transcription-complete] Found recording:', recording.id);
    
    // Find associated note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, status')
      .eq('recording_id', recording.id)
      .single();
      
    if (noteError) {
      console.error('[on-transcription-complete] Error finding note:', noteError);
      throw new Error(`Failed to find note for recording ${recording.id}`);
    }
    
    if (!note) {
      console.error('[on-transcription-complete] No note found for recording:', recording.id);
      throw new Error(`No note found for recording ${recording.id}`);
    }
    
    console.log('[on-transcription-complete] Found note:', note.id);
    
    // Handle different status cases
    if (status === 'completed' && result && result.text) {
      console.log('[on-transcription-complete] Processing completed transcription');
      
      const transcriptionText = result.text;
      
      // Update recording with transcription
      const { error: updateRecordingError } = await supabase
        .from('recordings')
        .update({
          transcription: transcriptionText,
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recording.id);
        
      if (updateRecordingError) {
        console.error('[on-transcription-complete] Error updating recording:', updateRecordingError);
        throw updateRecordingError;
      }
      
      // Update note with transcription
      const { error: updateNoteError } = await supabase
        .from('notes')
        .update({
          original_transcript: transcriptionText,
          status: 'completed',
          processing_progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);
        
      if (updateNoteError) {
        console.error('[on-transcription-complete] Error updating note:', updateNoteError);
        throw updateNoteError;
      }
      
      console.log('[on-transcription-complete] Successfully updated recording and note with transcription');
      
      // Trigger meeting minutes generation
      try {
        console.log('[on-transcription-complete] Triggering meeting minutes generation');
        await supabase.functions.invoke('generate-meeting-minutes', {
          body: { noteId: note.id }
        });
      } catch (minutesError) {
        // Don't fail if minutes generation fails, just log it
        console.error('[on-transcription-complete] Error triggering meeting minutes:', minutesError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Transcription processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (status === 'error' || transcriptionError) {
      console.log('[on-transcription-complete] Processing error state');
      
      // Update recording with error
      const { error: updateRecordingError } = await supabase
        .from('recordings')
        .update({
          status: 'error',
          error_message: transcriptionError || 'Unknown error during transcription',
          updated_at: new Date().toISOString()
        })
        .eq('id', recording.id);
        
      if (updateRecordingError) {
        console.error('[on-transcription-complete] Error updating recording error state:', updateRecordingError);
      }
      
      // Update note with error
      const { error: updateNoteError } = await supabase
        .from('notes')
        .update({
          status: 'error',
          error_message: transcriptionError || 'Unknown error during transcription',
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);
        
      if (updateNoteError) {
        console.error('[on-transcription-complete] Error updating note error state:', updateNoteError);
      }
      
      console.log('[on-transcription-complete] Updated error state for recording and note');
      
      return new Response(
        JSON.stringify({ success: true, message: 'Error state recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (status === 'processing') {
      console.log('[on-transcription-complete] Processing status update');
      
      // Update note with progress information
      const { error: updateNoteError } = await supabase
        .from('notes')
        .update({
          processing_progress: 50,  // Midpoint progress
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);
        
      if (updateNoteError) {
        console.error('[on-transcription-complete] Error updating note progress:', updateNoteError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Status update recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Default response for other statuses
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook received', status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[on-transcription-complete] Error in webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 200, // Return 200 even for errors to avoid webhook retries
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
