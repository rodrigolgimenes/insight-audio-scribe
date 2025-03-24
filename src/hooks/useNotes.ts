
import { useState, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  content?: string;
  user_id: string;
  recording_id?: string;
  created_at: string;
  updated_at: string;
  status: string;
  processing_progress?: number;
  duration?: number;
}

interface UseNotesOptions {
  limit?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export const useNotes = (options: UseNotesOptions = {}) => {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      // For now, return empty array - we'll implement this later
      setNotes([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    if (options.enabled !== false) {
      return fetchNotes();
    }
    return Promise.resolve();
  };

  useEffect(() => {
    if (options.refetchOnMount !== false && options.enabled !== false) {
      fetchNotes();
    }
  }, [options.refetchOnMount, options.enabled]);

  return {
    notes,
    isLoading,
    error,
    refetch
  };
};
