
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  noteId: string;
  isRegeneration?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { noteId, isRegeneration } = await req.json() as RequestBody;
    console.log('Starting minutes generation with params:', { noteId, isRegeneration });

    if (!noteId) {
      throw new Error('Note ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First fetch the transcript from the note
    console.log('Fetching note data...');
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('original_transcript, user_id')
      .eq('id', noteId)
      .single();

    if (noteError || !noteData?.original_transcript) {
      console.error('Error fetching note transcript:', noteError);
      throw new Error('Failed to fetch note transcript');
    }

    const transcript = noteData.original_transcript;
    const userId = noteData.user_id;

    // Always fetch fresh persona data
    console.log('Fetching persona data...');
    const { data: personaData, error: personaError } = await supabase
      .from('meeting_personas')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (personaError && personaError.code !== 'PGRST116') {
      console.error('Error fetching persona:', personaError);
    }

    // Build the persona-aware prompt
    let systemPrompt = `Você é um especialista em análise de reuniões profissionais, focado em gerar atas detalhadas e bem estruturadas em português, usando formatação Markdown.

Instruções Gerais:
1. Analise cuidadosamente a transcrição fornecida.
2. Estruture a ata em seções claras e bem definidas usando títulos Markdown (# para título principal, ## para subtítulos).
3. Use formatação Markdown de forma consistente:
   - Listas com hífens (-)
   - **Negrito** para enfatizar pontos importantes
   - *Itálico* para termos técnicos
   - ### para subseções
4. Inclua apenas informações presentes na transcrição.
5. Mantenha um tom profissional e objetivo.
6. Use emojis corporativos apropriados para melhorar a legibilidade:
   - 📅 Para datas e prazos
   - ✅ Para decisões tomadas
   - 📋 Para listas de tarefas
   - 🎯 Para objetivos
   - 👥 Para participantes
   - 📊 Para dados e métricas
   - ⚠️ Para pontos de atenção
   - 🔄 Para próximos passos
   - 💡 Para ideias e sugestões`;

    // Add persona context if available
    if (personaData) {
      const roleContext = personaData.custom_role || personaData.primary_role;
      const focusAreas = personaData.focus_areas?.join(', ') || '';
      const vocabulary = personaData.custom_vocabulary?.join('; ') || '';

      systemPrompt += `\n\n👤 Contexto do Profissional:
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
            content: `Por favor, gere uma ata detalhada para esta reunião com base na seguinte transcrição:\n\n${transcript}`
          }
        ],
        temperature: 0.7
      }),
    });

    if (!minutesResponse.ok) {
      const errorText = await minutesResponse.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`Failed to generate minutes with GPT-4: ${errorText}`);
    }

    const minutesData = await minutesResponse.json();
    const minutes = minutesData.choices[0].message.content;

    console.log('Minutes generated successfully, saving to database...');

    // Save the minutes
    const { error: upsertError } = await supabase
      .from('meeting_minutes')
      .upsert({
        note_id: noteId,
        content: minutes,
        format: 'markdown',
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
      status: 200
    });
  } catch (error) {
    console.error('Error generating meeting minutes:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error generating meeting minutes',
      details: error instanceof Error ? error.stack : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Mantemos 200 para evitar erro de CORS
    });
  }
});
