
export async function transcribeAudio(audioBlob: Blob, openAIApiKey: string) {
  console.log('Preparing audio file for transcription...');
  const openAIFormData = new FormData();
  openAIFormData.append('file', audioBlob);
  openAIFormData.append('model', 'whisper-1');
  openAIFormData.append('language', 'pt');

  const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
    },
    body: openAIFormData,
  });

  if (!openAIResponse.ok) {
    const errorData = await openAIResponse.json();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
  }

  return await openAIResponse.json();
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

  const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: gptPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!gptResponse.ok) {
    const errorData = await gptResponse.json();
    console.error('GPT API error:', errorData);
    throw new Error(`GPT processing failed: ${errorData.error?.message || gptResponse.statusText}`);
  }

  const gptData = await gptResponse.json();
  return gptData.choices[0].message.content;
}
