
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize OpenAI API client
const configuration = new Configuration({ 
  apiKey: Deno.env.get("OPENAI_API_KEY") 
});
const openai = new OpenAIApi(configuration);

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { noteId, threshold = 0.7, limit = 5 } = await req.json();
    
    if (!noteId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: noteId" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 1. Get the note data
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*, recordings(*)')
      .eq('id', noteId)
      .single();

    if (noteError) {
      console.error("Error fetching note:", noteError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch note: ${noteError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 2. Get note content for embedding
    const noteContent = note.processed_content || note.original_transcript || "";
    if (!noteContent) {
      return new Response(
        JSON.stringify({ error: "Note has no content to classify" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Generate embedding for note content
    console.log(`Generating embedding for note ${noteId} with content length ${noteContent.length}`);
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: noteContent.substring(0, 8000), // Limit to 8000 chars to avoid token limits
    });

    const [{ embedding }] = embeddingResponse.data.data;
    
    // 4. Find similar projects using RPC function
    console.log(`Finding similar projects with threshold ${threshold} and limit ${limit}`);
    const { data: similarProjects, error: projectError } = await supabase.rpc(
      'find_similar_projects',
      {
        project_embedding: JSON.stringify(embedding),
        similarity_threshold: threshold,
        max_results: limit
      }
    );

    if (projectError) {
      console.error("Error finding similar projects:", projectError);
      return new Response(
        JSON.stringify({ error: `Failed to find similar projects: ${projectError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Found ${similarProjects?.length || 0} similar projects`);
    
    // 5. Get project details
    const projectIds = similarProjects?.map(p => p.project_id) || [];
    let projectDetails = [];
    
    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
      
      if (projectsError) {
        console.error("Error fetching project details:", projectsError);
      } else {
        projectDetails = projects || [];
      }
    }

    // 6. Save classifications to notes_projects
    const timestamp = new Date().toISOString();
    const classificationsToInsert = similarProjects?.map(project => ({
      note_id: noteId,
      project_id: project.project_id,
      similarity_score: project.similarity,
      classified_at: timestamp,
      classification_reason: "Automatic classification by content similarity",
      created_at: timestamp
    })) || [];

    if (classificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notes_projects')
        .upsert(
          classificationsToInsert,
          { onConflict: 'note_id,project_id', ignoreDuplicates: false }
        );

      if (insertError) {
        console.error("Error saving classifications:", insertError);
        return new Response(
          JSON.stringify({ 
            error: `Failed to save classifications: ${insertError.message}`,
            classifications: similarProjects 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // 7. Combine project details with classifications
    const classificationsWithDetails = similarProjects?.map(project => {
      const details = projectDetails.find(p => p.id === project.project_id);
      return {
        projectId: project.project_id,
        similarity: project.similarity,
        projectName: details?.name || "Unknown Project"
      };
    }) || [];

    // Return response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Note classified successfully, found ${classificationsWithDetails.length} matching projects`,
        classifications: classificationsWithDetails
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unhandled error in classify-transcription:", error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message || "Unknown error"}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
