
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, transcript } = await req.json();

    console.log('Processing chat request:', {
      messageCount: messages.length,
      transcriptLength: transcript?.length,
      lastUserMessage: messages[messages.length - 1]?.content
    });

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
            content: `You are a helpful assistant that answers questions about a meeting transcript and can help with additional tasks related to the transcript.

Instructions:
1. When answering questions, use ONLY information from the transcript provided.
2. If you cannot find specific information in the transcript, respond with EXACTLY: "I didn't find this information in the transcript"
3. For special commands like generating meeting minutes or summaries, use the transcript as a base but feel free to structure and organize the information in a helpful way.
4. Always maintain a professional and helpful tone.

Here's the transcript to work with:

${transcript}

Remember: If you can't find specific information in the transcript, respond with "I didn't find this information in the transcript"`
          },
          ...messages
        ],
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      throw new Error('Failed to get response from OpenAI');
    }

    const data = await openAIResponse.json();
    console.log('OpenAI response received:', {
      status: openAIResponse.status,
      messageContent: data.choices[0].message.content.substring(0, 100) + '...'
    });

    const message = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-transcript function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
