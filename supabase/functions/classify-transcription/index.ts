
// 1) Necessary for some Deno libraries that use XMLHttpRequest
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// 2) HTTP server
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// 3) Supabase client (absolute URL, no import_map)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// 4) OpenAI client (absolute URL)
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Load and validate the environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error("❌ Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY");
  throw new Error("Missing environment variables");
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }));

// Constants
const EMBEDDING_MODEL = "text-embedding-ada-002";
const MAX_TOKENS = 8000;
const MAX_RETRIES = 3;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Parse request body
    const { noteId, threshold = 0.7, limit = 5 } = await req.json();
    
    if (!noteId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: noteId" }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
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
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 2. Get note content for embedding
    const noteContent = note.processed_content || note.original_transcript || "";
    if (!noteContent) {
      return new Response(
        JSON.stringify({ error: "Note has no content to classify" }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Generate embedding for note content with retry logic
    console.log(`Generating embedding for note ${noteId} with content length ${noteContent.length}`);
    
    let embedding;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const embeddingResponse = await openai.createEmbedding({
          model: EMBEDDING_MODEL,
          input: noteContent.substring(0, MAX_TOKENS), // Limit to avoid token limits
        });
        embedding = embeddingResponse.data.data[0].embedding;
        break;
      } catch (error) {
        console.error(`Embedding attempt ${attempt + 1} failed:`, error);
        if (attempt === MAX_RETRIES - 1) throw error;
        // Exponential backoff
        await new Promise(r => setTimeout(r, 2 ** attempt * 500));
      }
    }

    if (!embedding) {
      throw new Error("Failed to generate embedding after multiple attempts");
    }
    
    // 4. Find similar projects using RPC function
    console.log(`Finding similar projects with threshold ${threshold} and limit ${limit}`);
    const { data: similarProjects, error: projectError } = await supabase.rpc(
      'find_similar_projects',
      {
        search_embedding: embedding,
        similarity_threshold: threshold,
        max_results: limit
      }
    );

    if (projectError) {
      console.error("Error finding similar projects:", projectError);
      return new Response(
        JSON.stringify({ error: `Failed to find similar projects: ${projectError.message}` }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
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
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
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
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unhandled error in classify-transcription:", error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message || "Unknown error"}` }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
