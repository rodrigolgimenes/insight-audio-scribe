
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 32000,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1}/${maxAttempts} failed:`, {
        error: lastError.message,
        stack: lastError.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      const shouldTryAgain = shouldRetry(lastError);
      if (!shouldTryAgain || attempt + 1 >= maxAttempts) {
        console.error(`Operation failed after ${attempt + 1}/${maxAttempts} attempts:`, {
          error: lastError.message,
          stack: lastError.stack?.split('\n').slice(0, 3).join('\n')
        });
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      const finalDelay = delay + jitter;
      
      console.log(`Retry attempt ${attempt + 1}/${maxAttempts} failed. Retrying in ${Math.round(finalDelay/1000)}s...`);
      
      onRetry(attempt + 1, lastError, finalDelay);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
      attempt++;
    }
  }

  throw lastError || new Error('Operation failed after maximum retry attempts');
}
