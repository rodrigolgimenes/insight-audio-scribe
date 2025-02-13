
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithExponentialBackoff(
  operation: () => Promise<any>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<any> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.message.includes('server_error')) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`OpenAI server error encountered. Retry attempt ${i + 1}/${maxRetries} after ${delay}ms delay...`);
        console.log('Error details:', error.message);
        await wait(delay);
        continue;
      }
      console.error('Non-server error encountered:', error.message);
      throw error;
    }
  }
  
  console.error('Max retries reached. Last error:', lastError.message);
  throw lastError;
}

export async function transcribeAudio(audioBlob: Blob, openAIApiKey: string) {
  console.log('Preparing audio file for transcription...', {
    blobType: audioBlob.type,
    blobSize: audioBlob.size
  });

  const openAIFormData = new FormData();
  
  const processedBlob = new Blob([audioBlob], { type: 'audio/mp3' });
  
  console.log('Processed blob details:', {
    type: processedBlob.type,
    size: processedBlob.size
  });

  openAIFormData.append('file', processedBlob, 'audio.mp3');
  openAIFormData.append('model', 'whisper-1');
  openAIFormData.append('language', 'pt');

  console.log('Sending request to OpenAI Whisper API...');
  
  const makeRequest = async () => {
    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openAIFormData,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error response:', JSON.stringify(errorData, null, 2));
      console.log('Response status:', openAIResponse.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(openAIResponse.headers.entries()), null, 2));
      
      const error = new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
      if (errorData.error?.type === 'server_error') {
        error.message = 'server_error: ' + error.message;
      }
      throw error;
    }

    return openAIResponse.json();
  };

  const result = await retryWithExponentialBackoff(makeRequest);
  console.log('Transcription completed successfully');
  return result;
}

export async function processWithGPT(transcriptionText: string, openAIApiKey: string, userId?: string) {
  console.log('Processing transcription with GPT-4...');

  // First, analyze the transcript context
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
          content: `Please analyze this meeting transcript and list the main technical and business areas discussed: ${transcriptionText}`
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

  // First, refine the transcription with GPT-3.5-turbo
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
          content: `Please refine this transcription for clarity and readability, maintaining all important information: ${transcriptionText}` 
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!refineResponse.ok) {
    const errorData = await refineResponse.json();
    console.error('GPT-3.5 API error:', errorData);
    throw new Error(`Transcription refinement failed: ${errorData.error?.message || refineResponse.statusText}`);
  }

  const refineData = await refineResponse.json();
  const refinedTranscript = refineData.choices[0].message.content;

  // Generate the base prompt
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

  let finalPrompt = basePrompt;
  let personaPrompt = '';

  // If we have a userId, try to fetch and incorporate persona data
  if (userId) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: personaData, error: personaError } = await supabase
          .from('meeting_personas')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (personaError && personaError.code !== 'PGRST116') {
          console.error('Error fetching persona:', personaError);
        }

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
          finalPrompt = `${personaPrompt}${basePrompt}`;
        }
      }
    } catch (error) {
      console.error('Error handling persona data:', error);
      // Continue without persona data if there's an error
    }
  }

  finalPrompt = `${finalPrompt}

Análise de Contexto da Reunião:
${contextAnalysis}

Instruções Finais:
1. Utilize uma abordagem de raciocínio em cadeia para conectar informações e criar um documento coeso.
2. Gere apenas as seções que são relevantes para o conteúdo desta reunião específica.
3. Mantenha o foco na clareza e objetividade, sem expor seu processo de pensamento.
4. Utilize formatação markdown para melhor estruturação do conteúdo.

Agora, por favor, processe a seguinte transcrição:

${refinedTranscript}`;

  // Then, generate meeting minutes with GPT-4o-mini
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
          content: 'You are a professional meeting minutes generator. Create clear, structured, and actionable meeting minutes from transcriptions.' 
        },
        { 
          role: 'user', 
          content: finalPrompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!minutesResponse.ok) {
    const errorData = await minutesResponse.json();
    console.error('GPT-4o-mini API error:', errorData);
    throw new Error(`Meeting minutes generation failed: ${errorData.error?.message || minutesResponse.statusText}`);
  }

  const minutesData = await minutesResponse.json();
  return minutesData.choices[0].message.content;
}
