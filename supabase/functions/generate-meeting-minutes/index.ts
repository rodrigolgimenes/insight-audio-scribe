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

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
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

    const prompt = `
Por favor, gere uma ata de reunião bem formatada em markdown a partir da seguinte transcrição. 
A ata deve incluir:

# Título da Reunião

## Data e Hora
${dateTime || '(data não encontrada na transcrição)'}

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
      error: error.message || 'Error generating meeting minutes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});