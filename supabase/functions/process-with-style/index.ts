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
    console.log('Starting processing with style:', styleId);
    console.log('Raw transcript length:', transcript?.length || 0);

    if (!styleId || !transcript) {
      throw new Error('Style ID and transcript are required');
    }

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

    if (styleError) {
      console.error('Error fetching style:', styleError);
      throw styleError;
    }

    if (!style) {
      throw new Error('Style not found');
    }

    console.log('Style found:', {
      name: style.name,
      category: style.category,
      templateLength: style.prompt_template?.length || 0
    });
    
    // Replace the {{transcript}} placeholder in the prompt template
    const prompt = style.prompt_template.replace('{{transcript}}', transcript);
    console.log('Prompt prepared. Length:', prompt.length);
    console.log('Sending request to OpenAI...');

    // Process with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Transform the following text into a clear and organized format.'
          },
          { 
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('Full OpenAI response:', JSON.stringify(openAIData, null, 2));
    console.log('OpenAI response status:', openAIResponse.status);
    
    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', openAIData);
      throw new Error('Failed to process transcript: Invalid response format from OpenAI');
    }

    const processedContent = openAIData.choices[0].message.content;
    console.log('Processed content length:', processedContent.length);

    // Extract title from the processed content (assuming it's in an h1 tag)
    const titleMatch = processedContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Processed Note';
    console.log('Extracted title:', title);

    return new Response(
      JSON.stringify({ 
        title, 
        content: processedContent,
        styleId,
        originalTranscript: transcript 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in process-with-style function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});