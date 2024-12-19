import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Step 1: Receiving request data...');
    const { transcript } = await req.json();
    console.log('Received transcript:', transcript);

    if (!transcript) {
      throw new Error('Transcript is required');
    }

    // Step 2: Prepare the prompt with explicit formatting instruction
    console.log('\nStep 2: Preparing prompt...');
    const formattingInstruction = "Transforme o seguinte texto em uma lista de bullet points claros e concisos:\n\n";
    const finalPrompt = formattingInstruction + transcript;
    console.log('Final prompt with formatting instruction:', finalPrompt);

    // Step 3: Call OpenAI API
    console.log('\nStep 3: Calling OpenAI API...');
    try {
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
              role: 'user', 
              content: finalPrompt
            }
          ],
          temperature: 1,
          max_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json();
        console.error('OpenAI API error response:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      // Step 4: Process OpenAI response
      console.log('\nStep 4: Processing OpenAI response...');
      const openAIData = await openAIResponse.json();
      console.log('OpenAI response status:', openAIResponse.status);
      console.log('Full OpenAI response:', JSON.stringify(openAIData, null, 2));

      if (!openAIData.choices?.[0]?.message?.content) {
        console.error('Invalid OpenAI response structure:', openAIData);
        throw new Error('Failed to process text: Invalid response format from OpenAI');
      }

      const processedContent = openAIData.choices[0].message.content;
      console.log('Processed content length:', processedContent.length);
      console.log('First 100 chars of processed content:', processedContent.substring(0, 100));

      // Step 5: Send response
      console.log('\nStep 5: Sending response back to client...');
      return new Response(
        JSON.stringify({ 
          content: processedContent,
          fullPrompt: finalPrompt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      console.error('Error in OpenAI API call:', error);
      throw error;
    }
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