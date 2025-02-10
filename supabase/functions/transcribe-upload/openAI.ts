
export async function transcribeAudio(audioBlob: Blob, openAIApiKey: string) {
  console.log('Preparing audio file for transcription...', {
    blobType: audioBlob.type,
    blobSize: audioBlob.size
  });

  const openAIFormData = new FormData();
  
  // Create a new blob with explicit audio/webm MIME type
  const processedBlob = new Blob([audioBlob], { type: 'audio/webm' });
  
  openAIFormData.append('file', processedBlob, 'audio.webm');
  openAIFormData.append('model', 'whisper-1');
  openAIFormData.append('language', 'pt');

  console.log('Sending request to OpenAI Whisper API...');
  
  const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
    },
    body: openAIFormData,
  });

  if (!openAIResponse.ok) {
    const errorData = await openAIResponse.json();
    console.error('OpenAI API error:', JSON.stringify(errorData, null, 2));
    throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
  }

  const result = await openAIResponse.json();
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
