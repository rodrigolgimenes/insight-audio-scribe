
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
  
  // Try converting to mp3 MIME type as it's more widely supported
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

export async function processWithGPT(transcriptionText: string, openAIApiKey: string) {
  console.log('Processing transcription with GPT-4...');
  const gptPrompt = `Please analyze the following meeting transcript and provide a structured response with the following sections:

1. Summary
2. Key Points
3. Action Items
4. Next Steps

Transcript:
${transcriptionText}

Please format your response in a clear, structured way with headers for each section.`;

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
          content: gptPrompt.replace(transcriptionText, refinedTranscript)
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
