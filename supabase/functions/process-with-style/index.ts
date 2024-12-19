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
    // Step 1: Get transcript and style ID from request
    console.log('Step 1: Receiving request data...');
    const { styleId, transcript } = await req.json();
    console.log('Received styleId:', styleId);
    console.log('Received transcript length:', transcript?.length || 0);
    console.log('First 100 chars of transcript:', transcript?.substring(0, 100));

    if (!styleId || !transcript) {
      throw new Error('Style ID and transcript are required');
    }

    // Step 2: Get style template from database
    console.log('\nStep 2: Fetching style template...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      template_length: style.prompt_template?.length || 0
    });

    // Step 3: Prepare the prompt
    console.log('\nStep 3: Preparing prompt...');
    const finalPrompt = style.prompt_template.replace('{{transcript}}', transcript);
    console.log('Template before replacement:', style.prompt_template);
    console.log('Final prompt length:', finalPrompt.length);
    console.log('First 100 chars of final prompt:', finalPrompt.substring(0, 100));

    // Step 4: Call OpenAI API
    console.log('\nStep 4: Calling OpenAI API...');
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
            content: 'Transform the following text according to the given instructions.'
          },
          { 
            role: 'user', 
            content: finalPrompt
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

    // Step 5: Process OpenAI response
    console.log('\nStep 5: Processing OpenAI response...');
    const openAIData = await openAIResponse.json();
    console.log('OpenAI response status:', openAIResponse.status);
    console.log('Full OpenAI response:', JSON.stringify(openAIData, null, 2));

    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', openAIData);
      throw new Error('Failed to process transcript: Invalid response format from OpenAI');
    }

    const processedContent = openAIData.choices[0].message.content;
    console.log('Processed content length:', processedContent.length);
    console.log('First 100 chars of processed content:', processedContent.substring(0, 100));

    // Step 6: Extract title and prepare response
    console.log('\nStep 6: Preparing final response...');
    const titleMatch = processedContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Processed Note';
    console.log('Extracted title:', title);

    // Step 7: Send response
    console.log('\nStep 7: Sending response back to client...');
    return new Response(
      JSON.stringify({ 
        title, 
        content: processedContent,
        styleId,
        originalTranscript: transcript,
        fullPrompt: finalPrompt // Include the full prompt in the response
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