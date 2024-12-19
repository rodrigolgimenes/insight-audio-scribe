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
    console.log('Processing transcript with style:', styleId);
    console.log('Raw transcript received:', transcript);

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

    console.log('Style found:', style.name);
    console.log('Raw prompt template:', style.prompt_template);
    
    // Replace the {{transcript}} placeholder in the prompt template
    const prompt = style.prompt_template.replace('{{transcript}}', transcript);
    console.log('Final prompt being sent to GPT:', prompt);

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
            content: 'You are a helpful assistant that processes transcripts according to specific styles and formats. Your output MUST be in HTML format for proper rendering. Start with an appropriate title in an h1 tag, followed by the formatted content. Use appropriate HTML tags for formatting (p, ul, li, strong, em, etc). Make sure to maintain the original meaning while applying the style transformation.'
          },
          { 
            role: 'user', 
            content: `Please process this transcript according to the following instruction: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received');
    console.log('Raw OpenAI response:', openAIData.choices?.[0]?.message?.content);
    
    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response:', openAIData);
      throw new Error('Failed to process transcript with OpenAI');
    }

    const processedContent = openAIData.choices[0].message.content;

    // Extract title from the processed content (assuming it's in an h1 tag)
    const titleMatch = processedContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Processed Note';

    console.log('Successfully processed content with title:', title);
    console.log('Final processed content:', processedContent);

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