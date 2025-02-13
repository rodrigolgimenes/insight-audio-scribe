import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  transcript: string;
  noteId: string;
  isRegeneration?: boolean;
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
    const { transcript, noteId, isRegeneration } = await req.json() as RequestBody;

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

    // Check for existing minutes if not regenerating
    if (!isRegeneration) {
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
    }

    // Get the user ID from the note
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single();

    if (noteError) {
      throw new Error('Failed to fetch note data');
    }

    // Always fetch fresh persona data
    const { data: personaData, error: personaError } = await supabase
      .from('meeting_personas')
      .select('*')
      .eq('user_id', noteData.user_id)
      .maybeSingle();

    if (personaError && personaError.code !== 'PGRST116') {
      console.error('Error fetching persona:', personaError);
    }

    const dateTime = extractDateTime(transcript);
    console.log('Extracted date and time:', dateTime);

    // First, analyze the transcript context with GPT-3.5-turbo
    const contextAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a meeting context analyzer. Your task is to identify the main technical and business areas discussed in the meeting.'
          },
          {
            role: 'user',
            content: `Please analyze this meeting transcript and list the main technical and business areas discussed: ${transcript}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!contextAnalysisResponse.ok) {
      throw new Error('Failed to analyze transcript context');
    }

    const contextData = await contextAnalysisResponse.json();
    const contextAnalysis = contextData.choices[0].message.content;
    console.log('Context analysis:', contextAnalysis);

    // Build the persona-aware prompt with conditional vocabulary usage
    let personaPrompt = '';
    if (personaData) {
      const roleContext = personaData.custom_role || personaData.primary_role;
      const focusAreas = personaData.focus_areas?.join(', ') || '';
      const vocabulary = personaData.custom_vocabulary?.join('; ') || '';

      personaPrompt = `Como um especialista em análise de reuniões com experiência específica em adaptar conteúdo para profissionais de ${roleContext}, você irá gerar uma ata de reunião personalizada.

Contexto do Profissional:
- Função: ${roleContext}
- Áreas de Foco: ${focusAreas}
- Vocabulário Técnico Disponível: ${vocabulary}

Instruções de Contextualização:
1. Analise primeiro o contexto geral da reunião e identifique se ela aborda temas relacionados às áreas de foco do profissional.
2. Destaque insights técnicos e implicações estratégicas relevantes para este papel profissional específico.
3. Utilize o vocabulário técnico fornecido APENAS quando naturalmente aplicável ao contexto da discussão. Não force o uso de termos técnicos se o assunto da reunião não os justificar.
4. Priorize a discussão de tópicos alinhados com as áreas de foco do profissional, mas mantenha um equilíbrio com outros temas importantes discutidos.

`;
    }

    // Refine the transcript
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

    // Generate minutes with GPT-4o-mini using enhanced base prompt
    const basePrompt = `Você é um assistente especializado em análise de reuniões e transcrições. Utilizando uma abordagem analítica estruturada, gere uma ata de reunião que inclua as seguintes seções (adaptando-as conforme necessário e omitindo aquelas que não se aplicam ao contexto):

Principais Tópicos e Temas:
- Identifique e agrupe os assuntos centrais discutidos
- Destaque as nuances e pontos-chave de cada tema
- Estabeleça conexões entre tópicos relacionados

Decisões e Atribuições:
- Liste as decisões tomadas com clareza
- Identifique responsáveis por ações específicas
- Documente os próximos passos acordados

Prazos, Datas e Marcos Temporais:
- Organize cronologicamente os compromissos estabelecidos
- Destaque deadlines importantes
- Registre marcos e datas-chave mencionados

Dúvidas, Preocupações e Pontos de Atenção:
- Documente questões levantadas que precisam de esclarecimento
- Liste preocupações expressas pelos participantes
- Identifique possíveis riscos ou pontos de atenção

Contexto e Informações Complementares:
- Forneça contexto adicional necessário para entendimento
- Inclua referências a projetos ou iniciativas relacionadas
- Adicione informações de background relevantes`;

    const finalPrompt = `${personaPrompt}${basePrompt}

Análise de Contexto da Reunião:
${contextAnalysis}

Instruções Finais:
1. Utilize uma abordagem de raciocínio em cadeia para conectar informações e criar um documento coeso.
2. Gere apenas as seções que são relevantes para o conteúdo desta reunião específica.
3. Mantenha o foco na clareza e objetividade, sem expor seu processo de pensamento.
4. Utilize formatação markdown para melhor estruturação do conteúdo.

Agora, por favor, processe a seguinte transcrição:

${refinedTranscript}`;

    console.log('Using enhanced persona-aware prompt for meeting minutes generation');

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
          { role: 'user', content: finalPrompt }
        ],
      }),
    });

    if (!minutesResponse.ok) {
      throw new Error('Failed to generate minutes with GPT-4o-mini');
    }

    const minutesData = await minutesResponse.json();
    const minutes = minutesData.choices[0].message.content;

    // If regenerating, update existing record; otherwise insert new one
    const { error: upsertError } = await supabase
      .from('meeting_minutes')
      .upsert({
        note_id: noteId,
        content: minutes,
      });

    if (upsertError) {
      console.error('Error saving meeting minutes:', upsertError);
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
