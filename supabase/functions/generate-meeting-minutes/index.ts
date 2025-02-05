import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  transcript: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json() as RequestBody;

    if (!transcript) {
      throw new Error('Transcript is required');
    }

    const prompt = `
Por favor, gere uma ata de reunião bem formatada em markdown a partir da seguinte transcrição. 
A ata deve incluir:

# Título da Reunião

## Data e Hora
(extrair da transcrição ou usar data atual)

## Participantes
(identificar participantes mencionados na transcrição)

## Pauta
(principais tópicos discutidos)

## Decisões e Encaminhamentos
(pontos principais e decisões tomadas)

## Próximos Passos
(ações futuras mencionadas)

## Observações
(informações adicionais relevantes)

Transcrição:
${transcript}
`;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found');
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates meeting minutes in Portuguese using markdown formatting.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await openAIResponse.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const minutes = data.choices[0].message.content;

    return new Response(JSON.stringify({ minutes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating meeting minutes:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error generating meeting minutes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});