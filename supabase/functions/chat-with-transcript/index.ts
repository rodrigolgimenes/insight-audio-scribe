
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
            content: `Você é um assistente especializado em analisar e discutir transcrições de reuniões.

Instruções:
1. Use a transcrição fornecida como fonte primária de informação - ela é seu principal contexto.
2. SEMPRE busque informações relevantes na transcrição primeiro.
3. Se a pergunta for diretamente relacionada à transcrição mas você não encontrar a informação específica, responda com "Não encontrei essa informação específica na transcrição, mas..."
4. Se a pergunta for sobre um tópico geral ou conceitual mencionado na transcrição, você pode expandir sua resposta além do conteúdo da transcrição, usando seu conhecimento geral.
5. Mantenha um tom profissional e amigável.
6. Formate suas respostas usando Markdown para melhor legibilidade.

Aqui está a transcrição para referência:

${transcript}

Lembre-se: 
- A transcrição é sua fonte primária, mas não sua única fonte.
- Você pode complementar com conhecimento geral quando apropriado.
- Seja claro quando estiver fazendo referência à transcrição vs. fornecendo informações adicionais.`
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
