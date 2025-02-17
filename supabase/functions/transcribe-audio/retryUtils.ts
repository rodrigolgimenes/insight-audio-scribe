
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 32000,
    shouldRetry = () => true
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!shouldRetry(lastError) || attempt + 1 >= maxAttempts) {
        throw new Error(`Operation failed after ${attempt + 1} attempts. Last error: ${lastError.message}`);
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      
      console.log(`Retry attempt ${attempt + 1}/${maxAttempts} failed. Retrying in ${Math.round((delay + jitter)/1000)}s...`);
      console.error('Error details:', lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      attempt++;
    }
  }

  throw lastError || new Error('Operation failed');
}
