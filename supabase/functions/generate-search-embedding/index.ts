
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Maximum tokens to send to OpenAI API
const MAX_TOKENS = 8000;

interface RequestData {
  search_text: string;
}

// Generate embedding for search text without storing it
async function generateSearchEmbedding(searchText: string): Promise<Response> {
  try {
    console.log(`Generating search embedding for text of length: ${searchText.length}`);
    
    // Normalize text
    const normalizedText = searchText.trim().substring(0, MAX_TOKENS);
    
    if (normalizedText === '') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No text content to generate embedding for' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Generate embedding using OpenAI
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: normalizedText,
    });

    const [{ embedding }] = embeddingResponse.data.data;
    
    // Return the embedding without storing it
    return new Response(
      JSON.stringify({ 
        success: true, 
        embedding: embedding
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating search embedding:', error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message || 'Unknown error'}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Handle incoming requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // For POST requests, generate the embedding
    if (req.method === 'POST') {
      const requestData: RequestData = await req.json();
      
      if (!requestData.search_text) {
        return new Response(
          JSON.stringify({ error: 'search_text is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return await generateSearchEmbedding(requestData.search_text);
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
