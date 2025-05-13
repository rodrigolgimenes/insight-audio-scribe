
// 1) Necessary for some Deno libraries that use XMLHttpRequest
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// 2) HTTP server
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// 3) Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// 4) OpenAI client
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error("❌ Missing required environment variables");
  throw new Error("Missing required environment variables");
}

// Initialize Supabase and OpenAI clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }));

// Constants
const EMBEDDING_MODEL = "text-embedding-ada-002";
const SIMILARITY_THRESHOLD = 0.7;

/**
 * Generate an embedding for the given text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.createEmbedding({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Find projects similar to the given note content
 */
async function findSimilarProjects(
  noteContent: string,
  threshold: number = SIMILARITY_THRESHOLD,
  limit: number = 5
): Promise<Array<{ projectId: string; similarity: number; projectName?: string }>> {
  try {
    console.log(`Finding similar projects with threshold ${threshold} and limit ${limit}`);
    
    // Generate embedding for the note content
    const searchEmbedding = await generateEmbedding(noteContent);
    
    // Use the database function to find similar projects based on cosine similarity
    const { data, error } = await supabase
      .rpc('find_similar_projects', {
        project_embedding: searchEmbedding,
        similarity_threshold: threshold,
        max_results: limit
      });
    
    if (error) {
      console.error('Error finding similar projects:', error);
      throw new Error(`Failed to find similar projects: ${error.message}`);
    }
    
    // Fetch project names for the similar projects
    const projectIds = data.map(item => item.project_id);
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds);
    
    if (projectsError) {
      console.error('Error fetching project names:', projectsError);
    }
    
    // Combine similarity scores with project names
    return data.map(item => {
      const project = projects?.find(p => p.id === item.project_id);
      return {
        projectId: item.project_id,
        similarity: item.similarity,
        projectName: project?.name
      };
    });
  } catch (error) {
    console.error('Error in findSimilarProjects:', error);
    throw new Error(`Failed to find similar projects: ${error.message}`);
  }
}

/**
 * Classify a note to relevant projects
 */
async function classifyNoteToProjects(
  noteId: string,
  noteContent?: string,
  threshold: number = SIMILARITY_THRESHOLD,
  limit: number = 5
): Promise<Array<{ projectId: string; similarity: number; projectName?: string }>> {
  try {
    let content = noteContent;
    
    // If no content is provided, fetch the note content
    if (!content) {
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('title, processed_content, original_transcript')
        .eq('id', noteId)
        .single();
      
      if (noteError || !note) {
        console.error('Error fetching note:', noteError);
        throw new Error(`Failed to fetch note: ${noteError?.message || 'Note not found'}`);
      }
      
      content = [
        note.title || '',
        note.processed_content || '',
        note.original_transcript || ''
      ].filter(Boolean).join('\n\n');
    }
    
    // Find similar projects
    const similarProjects = await findSimilarProjects(content, threshold, limit);
    
    // Record the classification in the database
    if (similarProjects.length > 0) {
      const now = new Date().toISOString();
      const classifications = similarProjects.map(project => ({
        note_id: noteId,
        project_id: project.projectId,
        similarity_score: project.similarity,
        classified_at: now,
        classification_reason: 'automatic-embedding'
      }));
      
      const { error: insertError } = await supabase
        .from('notes_projects')
        .upsert(classifications, { onConflict: 'note_id,project_id' });
      
      if (insertError) {
        console.error('Error recording classifications:', insertError);
      }
    }
    
    return similarProjects;
  } catch (error) {
    console.error('Error in classifyNoteToProjects:', error);
    throw new Error(`Failed to classify note: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  
  try {
    // Parse request body
    const { noteId, noteContent, threshold = SIMILARITY_THRESHOLD, limit = 5 } = await req.json();
    
    if (!noteId && !noteContent) {
      return new Response(
        JSON.stringify({ error: 'Either noteId or noteContent is required' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Classify note to relevant projects
    const classifications = await classifyNoteToProjects(noteId, noteContent, threshold, limit);
    
    // Return classifications
    return new Response(
      JSON.stringify({ 
        success: true, 
        classifications,
        count: classifications.length
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in classify-transcription function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
