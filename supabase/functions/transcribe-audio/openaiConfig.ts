
/**
 * Creates and configures an OpenAI client
 */
export function createOpenAIClient() {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    console.error('[openaiConfig] OpenAI API key not found in environment variables');
    return null;
  }
  
  return {
    apiKey
  };
}
