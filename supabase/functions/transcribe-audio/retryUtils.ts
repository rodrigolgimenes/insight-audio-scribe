
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
        console.error('Operation failed:', {
          attempt: attempt + 1,
          maxAttempts,
          error: lastError.message,
          stack: lastError.stack
        });
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      
      console.log(`Retry attempt ${attempt + 1}/${maxAttempts}. Error: ${lastError.message}. Retrying in ${Math.round((delay + jitter)/1000)}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      attempt++;
    }
  }

  throw lastError || new Error('Operation failed');
}
