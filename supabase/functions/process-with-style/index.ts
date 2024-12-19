import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { styleId, transcript } = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the style from the database
    const { data: style, error: styleError } = await supabase
      .from('styles')
      .select('*')
      .eq('id', styleId)
      .single();

    if (styleError) throw styleError;

    // Replace the {{transcript}} placeholder in the prompt template
    const prompt = style.prompt_template.replace('{{transcript}}', transcript);

    // Process with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that processes transcripts according to specific styles and formats. Your output should be in HTML format for proper rendering.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('Failed to process transcript with OpenAI');
    }

    const processedContent = openAIData.choices[0].message.content;

    // Extract title from the processed content (assuming it's in the first line)
    const lines = processedContent.split('\n');
    const title = lines[0].replace(/<[^>]+>/g, '').trim();
    const content = processedContent;

    return new Response(
      JSON.stringify({ title, content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});