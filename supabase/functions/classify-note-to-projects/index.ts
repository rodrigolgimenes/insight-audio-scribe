
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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
    const { noteId, threshold = 0.7, limit = 5 } = await req.json();
    if (!noteId) {
      return new Response(
        JSON.stringify({ success: false, error: "Note ID is required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[classify-note] Processing note: ${noteId}`);

    // Setup clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openaiConfig = new Configuration({ apiKey: Deno.env.get("OPENAI_API_KEY") });
    const openai = new OpenAIApi(openaiConfig);

    // 1. Fetch the note content (from meeting_minutes if available, or from original_transcript)
    const { data: meetingMinutes, error: meetingMinutesError } = await supabase
      .from('meeting_minutes')
      .select('content, note_id')
      .eq('note_id', noteId)
      .maybeSingle();

    // If no meeting minutes, get the note's original transcript
    let contentToEmbed = "";
    if (!meetingMinutes) {
      console.log(`[classify-note] No meeting minutes found, checking original transcript`);
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('original_transcript, processed_content')
        .eq('id', noteId)
        .single();

      if (noteError || !note) {
        return new Response(
          JSON.stringify({ success: false, error: `Note not found: ${noteError?.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      contentToEmbed = note.processed_content || note.original_transcript || "";
      if (!contentToEmbed) {
        return new Response(
          JSON.stringify({ success: false, error: "No content available to classify" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else {
      contentToEmbed = meetingMinutes.content;
    }

    // 2. Generate embedding for the note content
    console.log(`[classify-note] Generating embedding for content of length: ${contentToEmbed.length}`);
    const MAX_TOKENS = 8000;
    const trimmedContent = contentToEmbed.trim().substring(0, MAX_TOKENS);
    
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: trimmedContent,
    });
    
    if (!embeddingResponse.data.data || embeddingResponse.data.data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate embedding" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const [{ embedding }] = embeddingResponse.data.data;
    console.log(`[classify-note] Generated embedding with ${embedding.length} dimensions`);

    // 3. Find similar projects using the embedding
    const { data: similarProjects, error: similarProjectsError } = await supabase.rpc(
      'find_similar_projects',
      {
        project_embedding: embedding,
        similarity_threshold: threshold,
        max_results: limit
      }
    );

    if (similarProjectsError) {
      console.error('[classify-note] Error finding similar projects:', similarProjectsError);
      return new Response(
        JSON.stringify({ success: false, error: `Error finding similar projects: ${similarProjectsError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[classify-note] Found ${similarProjects?.length || 0} similar projects`);

    // 4. Fetch project details
    const projectIds = similarProjects.map((p: any) => p.project_id);
    
    if (projectIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No similar projects found", 
          classifications: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: projectDetails, error: projectDetailsError } = await supabase
      .from('projects')
      .select('id, name, description')
      .in('id', projectIds);
      
    if (projectDetailsError) {
      console.error('[classify-note] Error fetching project details:', projectDetailsError);
    }
    
    // 5. Create an array of classifications with similarity scores and reasons
    const classifications = similarProjects.map((p: any) => {
      const projectDetail = projectDetails?.find((pd: any) => pd.id === p.project_id) || null;
      const similarity = p.similarity;
      
      // Generate classification reason
      let reason = "";
      if (similarity > 0.85) {
        reason = "Strong semantic similarity";
      } else if (similarity > 0.75) {
        reason = "Moderate semantic similarity";
      } else {
        reason = "Partial semantic similarity";
      }

      return {
        project_id: p.project_id,
        project_name: projectDetail?.name || "Unknown Project",
        project_description: projectDetail?.description || null,
        similarity_score: similarity,
        classification_reason: reason
      };
    });

    // 6. Insert or update the classifications in notes_projects table
    const now = new Date().toISOString();
    const notesProjectsData = classifications.map(c => ({
      note_id: noteId,
      project_id: c.project_id,
      similarity_score: c.similarity_score,
      classification_reason: c.classification_reason,
      classified_at: now
    }));

    // Use upsert to insert or update the classifications
    const { error: upsertError } = await supabase
      .from('notes_projects')
      .upsert(notesProjectsData, {
        onConflict: 'note_id,project_id',
        ignoreDuplicates: false
      });
      
    if (upsertError) {
      console.error('[classify-note] Error upserting classifications:', upsertError);
      return new Response(
        JSON.stringify({ success: false, error: `Error saving classifications: ${upsertError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 7. Return the classifications
    return new Response(
      JSON.stringify({
        success: true,
        message: `Classified note ${noteId} into ${classifications.length} projects`,
        classifications
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[classify-note] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: `Unexpected error: ${error.message || 'Unknown error'}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
