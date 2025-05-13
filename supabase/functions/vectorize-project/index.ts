
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

// Load and validate environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error("❌ Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY");
  throw new Error("Missing environment variables");
}

// Initialize Supabase and OpenAI clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }));

// Constants
const EMBEDDING_MODEL = "text-embedding-ada-002";
const MAX_TOKENS = 8000;
const MAX_RETRIES = 3;

/**
 * Create a standardized content hash using Base64 encoding
 * This matches the client-side approach for consistency
 */
function createContentHash(content: string): string {
  try {
    // Use Base64 encoding and take first 12 characters for the hash
    return btoa(content).slice(0, 12);
  } catch (error) {
    console.error('Error creating content hash:', error);
    
    // Fallback to simpler hash if btoa fails (non-ASCII characters)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16).slice(0, 12);
  }
}

// Generate embedding with retry logic
async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.slice(0, MAX_TOKENS);
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.createEmbedding({
        model: EMBEDDING_MODEL,
        input,
      });
      return response.data.data[0].embedding;
    } catch (err) {
      console.error(`Embedding generation attempt ${attempt + 1} failed:`, err);
      if (attempt === MAX_RETRIES - 1) throw err;
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
    }
  }
  throw new Error("Failed to generate embedding after multiple attempts");
}

// Generate and store embeddings for a project
async function vectorizeProject(
  projectId: string, 
  manualTrigger = false,
  contentOverride?: string,
  contentHashOverride?: string,
  fieldTypeOverride: string = 'full',
  forceUpdate: boolean = false
): Promise<Response> {
  try {
    console.log(`Processing project ID: ${projectId}, fieldType: ${fieldTypeOverride}`);
    
    let normalizedText = '';
    let contentHash = '';
    
    // If content is provided directly, use it
    if (contentOverride) {
      normalizedText = contentOverride.trim().substring(0, MAX_TOKENS);
      contentHash = contentHashOverride || createContentHash(normalizedText);
      console.log(`Using override content with hash: ${contentHash}`);
    } else {
      // Otherwise fetch the project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError || !project) {
        console.error('Error fetching project:', projectError);
        return new Response(
          JSON.stringify({ error: `Project not found: ${projectError?.message || 'Unknown error'}` }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Prepare text content from project fields
      const textFields = [
        project.name || '',
        project.description || '',
        project.scope || '',
        project.objective || '',
        project.user_role || ''
      ];

      // Add array fields with proper labeling
      if (project.business_area && Array.isArray(project.business_area)) {
        textFields.push(`Business areas: ${project.business_area.join(', ')}`);
      }

      if (project.key_terms && Array.isArray(project.key_terms)) {
        textFields.push(`Key terms: ${project.key_terms.join(', ')}`);
      }

      if (project.meeting_types && Array.isArray(project.meeting_types)) {
        textFields.push(`Meeting types: ${project.meeting_types.join(', ')}`);
      }

      // Combine all text into a single string and normalize
      normalizedText = textFields.filter(text => text.trim() !== '').join('\n\n');
      normalizedText = normalizedText.trim().substring(0, MAX_TOKENS);

      // Create a hash of the content
      contentHash = createContentHash(normalizedText);
      console.log(`Generated content hash from project data: ${contentHash}`);
    }

    // Check if we already have an embedding with this content hash and field type
    const { data: existingEmbedding, error: existingEmbeddingError } = await supabase
      .from('project_embeddings')
      .select('content_hash, field_type')
      .eq('project_id', projectId)
      .eq('field_type', fieldTypeOverride)
      .maybeSingle();

    // If manual trigger is not set and content hasn't changed, return early
    if (
      !manualTrigger && 
      !forceUpdate &&
      existingEmbedding && 
      !existingEmbeddingError && 
      existingEmbedding.content_hash === contentHash
    ) {
      console.log('Content unchanged, skipping embedding generation');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Embedding already exists and content unchanged' 
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // If there's no text to embed, log and return
    if (normalizedText === '') {
      console.log('No text to embed');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No text content to generate embeddings for' 
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Generating embedding for text of length:', normalizedText.length);
    
    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(normalizedText);
    
    // Store the embedding - using upsert which now works with the composite key
    const { data: upsertData, error: upsertError } = await supabase
      .from('project_embeddings')
      .upsert({
        project_id: projectId,
        embedding: embedding,
        content_hash: contentHash,
        updated_at: new Date().toISOString(),
        content: normalizedText,
        field_type: fieldTypeOverride
      }, {
        onConflict: 'project_id,field_type'
      });

    if (upsertError) {
      console.error('Error upserting embedding:', upsertError);
      return new Response(
        JSON.stringify({ error: `Failed to store embedding: ${upsertError.message}` }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log and return success
    console.log('Successfully generated and stored embedding for project:', projectId, 'with field_type:', fieldTypeOverride);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Embedding generated and stored successfully',
        project_id: projectId,
        field_type: fieldTypeOverride,
        vector_length: embedding.length
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in vectorizeProject:', error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message || 'Unknown error'}` }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // For POST requests, process the embedding
    if (req.method === 'POST') {
      const requestData = await req.json();
      
      if (!requestData.project_id) {
        return new Response(
          JSON.stringify({ error: 'project_id is required' }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return await vectorizeProject(
        requestData.project_id, 
        requestData.manual_trigger,
        requestData.content,
        requestData.contentHash,
        requestData.fieldType,
        requestData.forceUpdate
      );
    }

    // Handle unsupported methods
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown server error' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
