
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }
    
    const audioBucketExists = buckets.some(bucket => bucket.name === 'audio-recordings');
    
    if (!audioBucketExists) {
      // Create bucket for audio recordings
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('audio-recordings', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg']
        });
      
      if (createBucketError) {
        throw new Error(`Error creating bucket: ${createBucketError.message}`);
      }
      
      console.log('Created audio-recordings bucket');
    } else {
      console.log('audio-recordings bucket already exists');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: audioBucketExists ? 
          'audio-recordings bucket already exists' : 
          'Created audio-recordings bucket successfully' 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
