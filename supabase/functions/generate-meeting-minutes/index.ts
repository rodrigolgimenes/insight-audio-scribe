
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

  // Check for required environment variables
  if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
    console.error('Missing required environment variables');
    throw new Error('Missing required environment variables');
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { noteId, transcript: providedTranscript, isRegeneration = false } = await req.json();
    
    console.log('[generate-meeting-minutes] Request received for note:', noteId);
    console.log('[generate-meeting-minutes] Is regeneration:', isRegeneration);
    console.log('[generate-meeting-minutes] Transcript provided:', !!providedTranscript);

    // Update the note status to show we're generating minutes
    await supabase
      .from('notes')
      .update({ 
        status: 'generating_minutes',
        processing_progress: 90 
      })
      .eq('id', noteId);

    // Get the note data to access the transcript
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('original_transcript, recording_id')
      .eq('id', noteId)
      .single();

    if (noteError) {
      console.error('[generate-meeting-minutes] Error fetching note:', noteError);
      throw new Error(`Failed to fetch note: ${noteError.message}`);
    }

    // Use the provided transcript if available, otherwise use the one from the note
    const transcript = providedTranscript || noteData.original_transcript;
    
    if (!transcript) {
      console.error('[generate-meeting-minutes] No transcript available for note:', noteId);
      throw new Error('No transcript available for this note');
    }

    // Initialize OpenAI API
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    const openai = new OpenAIApi(configuration);

    console.log('[generate-meeting-minutes] Generating meeting minutes...');

    // Generate meeting minutes using OpenAI
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional assistant that creates well-structured meeting minutes from transcripts. Format the output in markdown with appropriate sections like 'Date & Time', 'Participants', 'Meeting Objective', 'Discussion Points', 'Action Items', and 'Decisions Made'."
        },
        {
          role: "user",
          content: `Please create meeting minutes from this transcription: ${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (!response.data.choices[0].message?.content) {
      throw new Error('Failed to generate meeting minutes: Empty response from OpenAI');
    }

    const minutes = response.data.choices[0].message.content;
    console.log('[generate-meeting-minutes] Minutes generated successfully, length:', minutes.length);

    // Save meeting minutes to the database
    const { error: insertError } = await supabase
      .from('meeting_minutes')
      .upsert([
        {
          note_id: noteId,
          content: minutes,
          format: 'markdown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { 
        onConflict: 'note_id' 
      });

    if (insertError) {
      console.error('[generate-meeting-minutes] Error saving minutes:', insertError);
      throw new Error(`Failed to save meeting minutes: ${insertError.message}`);
    }

    // Update the note status to completed
    await supabase
      .from('notes')
      .update({ 
        status: 'completed',
        processing_progress: 100 
      })
      .eq('id', noteId);
    
    // Also update the recording status for consistency
    if (noteData.recording_id) {
      await supabase
        .from('recordings')
        .update({ 
          status: 'completed'
        })
        .eq('id', noteData.recording_id);
    }

    console.log('[generate-meeting-minutes] Process completed successfully for note:', noteId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        minutes 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[generate-meeting-minutes] Error:', error);

    try {
      // If we have a noteId from the request, update the note status to error
      const requestData = await req.json();
      if (requestData.noteId) {
        await supabase
          .from('notes')
          .update({ 
            status: 'error',
            processing_progress: 0,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', requestData.noteId);
      }
    } catch (updateError) {
      console.error('[generate-meeting-minutes] Error updating note status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Using 200 even for errors to avoid CORS issues
      }
    );
  }
});
