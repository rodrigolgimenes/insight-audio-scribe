
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

    console.log('Starting minutes generation with:', {
      hasTranscript: !!transcript,
      noteId,
      isRegeneration,
      transcriptLength: transcript?.length
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing minutes if not regenerating
    if (!isRegeneration) {
      console.log('Checking for existing minutes...');
      const { data: existingMinutes, error: existingError } = await supabase
        .from('meeting_minutes')
        .select('content')
        .eq('note_id', noteId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing minutes:', existingError);
      } else if (existingMinutes) {
        console.log('Found existing minutes, returning them');
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
      console.error('Error fetching note data:', noteError);
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
      console.error('Context analysis failed:', await contextAnalysisResponse.text());
      throw new Error('Failed to analyze transcript context');
    }

    const contextData = await contextAnalysisResponse.json();
    const contextAnalysis = contextData.choices[0].message.content;
    console.log('Context analysis:', contextAnalysis);

    // Build the persona-aware prompt
    let systemPrompt = `Você é um especialista em análise de reuniões profissionais, focado em gerar atas detalhadas e bem estruturadas em português.

Instruções Gerais:
1. Analise cuidadosamente a transcrição fornecida.
2. Estruture a ata em seções claras e bem definidas.
3. Use formatação markdown para melhor legibilidade.
4. Inclua apenas informações presentes na transcrição.
5. Mantenha um tom profissional e objetivo.

Estrutura da Ata:
# Ata de Reunião${dateTime ? ` - ${dateTime}` : ''}

## Contexto e Objetivos
[Resumo do contexto e objetivos principais da reunião]

## Principais Tópicos Discutidos
[Liste e detalhe os principais assuntos abordados]

## Decisões e Encaminhamentos
[Liste as decisões tomadas e próximos passos definidos]

## Pontos de Ação
[Liste as ações acordadas, responsáveis e prazos quando mencionados]

## Informações Adicionais
[Outras informações relevantes mencionadas na reunião]`;

    // Add persona context if available
    if (personaData) {
      const roleContext = personaData.custom_role || personaData.primary_role;
      const focusAreas = personaData.focus_areas?.join(', ') || '';
      const vocabulary = personaData.custom_vocabulary?.join('; ') || '';

      systemPrompt += `

Contexto do Profissional:
- Função: ${roleContext}
- Áreas de Foco: ${focusAreas}
- Vocabulário Técnico: ${vocabulary}

Adaptações Específicas:
1. Destaque aspectos relevantes para ${roleContext}
2. Priorize informações relacionadas a: ${focusAreas}
3. Utilize o vocabulário técnico apropriado quando relevante
4. Mantenha o foco nas implicações práticas para este perfil profissional`;
    }

    console.log('Generating minutes with GPT-4...');

    const minutesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Por favor, gere uma ata detalhada para esta reunião com base na seguinte transcrição:

${transcript}

Análise de Contexto:
${contextAnalysis}`
          }
        ],
      }),
    });

    if (!minutesResponse.ok) {
      console.error('Minutes generation failed:', await minutesResponse.text());
      throw new Error('Failed to generate minutes with GPT-4o-mini');
    }

    const minutesData = await minutesResponse.json();
    const minutes = minutesData.choices[0].message.content;

    console.log('Minutes generated successfully, saving to database...');

    // If regenerating, update existing record; otherwise insert new one
    const { error: upsertError } = await supabase
      .from('meeting_minutes')
      .upsert({
        note_id: noteId,
        content: minutes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error saving meeting minutes:', upsertError);
      throw new Error('Failed to save meeting minutes');
    }

    console.log('Minutes saved successfully');

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
