
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processRecording } from "./handlers.ts";
import { corsHeaders } from "./utils.ts";
import { ProcessRecordingRequest, ProcessResponse } from "./types.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json() as ProcessRecordingRequest;
    const response = await processRecording(requestBody);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-recording] Error:', error);
    
    const errorResponse: ProcessResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 200, // Keep 200 to avoid CORS error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
