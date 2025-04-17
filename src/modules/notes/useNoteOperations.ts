
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/types/notes';
import { transformNoteFromDB } from './noteTransformer';

export const useNoteOperations = (noteId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateNote = async (updates: Partial<Note>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .single();
        
      if (updateError) throw updateError;
      
      return data ? transformNoteFromDB(data) : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteNote = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
        
      if (deleteError) throw deleteError;
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateNote,
    deleteNote,
    isLoading,
    error
  };
};
