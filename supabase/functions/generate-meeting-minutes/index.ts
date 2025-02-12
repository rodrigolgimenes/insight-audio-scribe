
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  transcript: string;
  noteId: string;
}

function extractDateTime(transcript: string): string | null {
  // First, try to match the title format "Recording DD/MM/YYYY, HH:mm:ss"
  const titleMatch = transcript.match(/Recording (\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})/);
  
  if (titleMatch) {
    const [_, date, time] = titleMatch;
    try {
      // Convert to a more readable format
      const [day, month, year] = date.split('/');
      const dateObj = new Date(`${year}-${month}-${day}T${time}`);
      
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date created:', { date, time });
        return null;
      }
      
      // Format the date in Portuguese
      const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const weekDay = weekDays[dateObj.getDay()];
      
      return `${date}, ${weekDay}, ${time}`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  // If no match in title, try to find any date/time pattern in the text
  const generalDateMatch = transcript.match(/\d{2}\/\d{2}\/\d{4}/);
  const generalTimeMatch = transcript.match(/\d{2}:\d{2}:\d{2}/);
  
  if (generalDateMatch && generalTimeMatch) {
    return extractDateTime(`Recording ${generalDateMatch[0]}, ${generalTimeMatch[0]}`);
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript, noteId } = await req.json() as RequestBody;

    if (!transcript || !noteId) {
      throw new Error('Transcript and noteId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingMinutes } = await supabase
      .from('meeting_minutes')
      .select('content')
      .eq('note_id', noteId)
      .maybeSingle();

    if (existingMinutes) {
      return new Response(JSON.stringify({ minutes: existingMinutes.content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateTime = extractDateTime(transcript);
    console.log('Extracted date and time:', dateTime);

    // First, refine the transcript with GPT-3.5-turbo
    const refineResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a transcription refinement specialist. Your task is to improve the clarity and readability of meeting transcriptions while maintaining their original meaning and content.'
          },
          {
            role: 'user',
            content: `Please refine this transcription for clarity and readability, maintaining all important information: ${transcript}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!refineResponse.ok) {
      throw new Error('Failed to refine transcript with GPT-3.5-turbo');
    }

    const refineData = await refineResponse.json();
    const refinedTranscript = refineData.choices[0].message.content;

    // Generate minutes with GPT-4o-mini
    const prompt = `Você é um assistente especializado em análise de reuniões e transcrições. A seguir, analise a transcrição da reunião que vou fornecer e, utilizando sua capacidade de cadeia de pensamento dinâmica, gere um resumo estruturado com os seguintes elementos – adaptando e criando seções conforme o conteúdo, sem utilizar tópicos pré-definidos se o conteúdo não os justificar:

Principais Tópicos e Temas: Identifique os assuntos centrais e as nuances discutidas, agrupando informações relacionadas.

Decisões e Atribuições: Liste as decisões tomadas, indicando quem são os responsáveis e quais ações foram definidas, se aplicável.

Prazos, Datas e Marcos Temporais: Extraia e organize datas, prazos e marcos relevantes mencionados na reunião.

Dúvidas, Preocupações e Pontos de Atenção: Identifique e resuma as principais preocupações, dúvidas ou pontos de alerta levantados durante a reunião.

Contexto e Informações Complementares: Inclua detalhes contextuais que auxiliem na compreensão do andamento dos projetos ou processos discutidos.

Utilize uma abordagem de raciocínio em cadeia para explorar e conectar as informações, garantindo que cada seção do resumo seja gerada dinamicamente com base no conteúdo. Não crie seções desnecessárias; apenas produza aquelas que fazem sentido conforme a transcrição fornecida.

Finalmente, apresente o resumo final de forma clara, objetiva e estruturada, sem expor seu processo de pensamento. Agora, processe a seguinte transcrição:

${refinedTranscript}`;

    const minutesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates meeting minutes in Portuguese using markdown formatting.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!minutesResponse.ok) {
      throw new Error('Failed to generate minutes with GPT-4o-mini');
    }

    const minutesData = await minutesResponse.json();
    const minutes = minutesData.choices[0].message.content;

    // Save the generated minutes to the database
    const { error: insertError } = await supabase
      .from('meeting_minutes')
      .insert({
        note_id: noteId,
        content: minutes,
      });

    if (insertError) {
      console.error('Error saving meeting minutes:', insertError);
      throw new Error('Failed to save meeting minutes');
    }

    return new Response(JSON.stringify({ minutes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating meeting minutes:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error generating meeting minutes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
