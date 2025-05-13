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

// Maximum number of tokens to send to OpenAI API
const MAX_TOKENS = 8000;

interface RequestData {
  project_id: string;
  manual_trigger?: boolean;
  content?: string;
  contentHash?: string;
  fieldType?: string;
  forceUpdate?: boolean;
}

// Simple hash function for content change detection
function createContentHash(content: string): string {
  // Simple hash function that provides a unique string based on content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
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
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
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

      // Create a hash of the content to check if it has changed
      contentHash = createContentHash(normalizedText);
    }

    // Check if we already have an embedding with this content hash
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Generating embedding for text of length:', normalizedText.length);
    
    // Generate embedding using OpenAI
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: normalizedText,
    });

    const [{ embedding }] = embeddingResponse.data.data;
    
    // Store the embedding as a JSONB array
    const { error: upsertError } = await supabase
      .from('project_embeddings')
      .upsert({
        project_id: projectId,
        embedding: embedding, // Store directly as JSONB
        content_hash: contentHash,
        updated_at: new Date().toISOString(),
        content: normalizedText, // Store the normalized content for debugging
        field_type: fieldTypeOverride
      });

    if (upsertError) {
      console.error('Error upserting embedding:', upsertError);
      return new Response(
        JSON.stringify({ error: `Failed to store embedding: ${upsertError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log and return success
    console.log('Successfully generated and stored embedding for project:', projectId);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Embedding generated and stored successfully',
        project_id: projectId,
        vector_length: embedding.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in vectorizeProject:', error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message || 'Unknown error'}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // For POST requests, process the embedding
    if (req.method === 'POST') {
      const requestData: RequestData = await req.json();
      
      if (!requestData.project_id) {
        return new Response(
          JSON.stringify({ error: 'project_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
